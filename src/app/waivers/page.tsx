"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSignedWaiversForRegisteredEvents } from "@/app/actions/waivers/action";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import WaiverSignatureSkeleton from "@/components/WaiverSignatureComponent/WaiverSignatureSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, User, Users, ExternalLink, AlertTriangle, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMobileDetection from "@/hooks/useMobileDetection";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Interface for the full waiver document returned by the server action
interface FullSignedWaiver {
  waiver: {
    _id: string;
    fileKey: string;
    uploadedAt: Date;
    isForChild: boolean;
    childSubdocId?: string;
    eventId: string;
  };
  event: { title: string; startDate: string; endDate: string };
  childName?: string;
}

// Interface expected by WaiverSignatureComponent
interface RegisteredEvent {
  id: string;
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signatureDate: Date;
  fileKey: string;
  childId?: string;
  childName?: string;
  signByDate?: Date;
}

// Interface for grouped waivers
interface GroupedWaivers {
  user: RegisteredEvent[];
  children: {
    [childId: string]: {
      name: string;
      waivers: RegisteredEvent[];
    };
  };
}

export default function WaiversPage() {
  const [groupedWaivers, setGroupedWaivers] = useState<GroupedWaivers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWaiverUrl, setCurrentWaiverUrl] = useState<string | null>(null);
  const [currentWaiverTitle, setCurrentWaiverTitle] = useState<string>("");
  const { isLoaded, user } = useUser();
  const [activeTab, setActiveTab] = useState<string>("all");
  const isMobile = useMobileDetection();

  useEffect(() => {
    const fetchSignedWaiversData = async () => {
      try {
        if (!isLoaded || !user) return;

        // Fetch user data to get MongoDB _id and children
        const userResponse = await fetch(`/api/users/${user.id}`, {
          method: "GET",
        });
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        // Fetch signed waivers using the server action
        const signedWaivers: FullSignedWaiver[] = await getSignedWaiversForRegisteredEvents(userData._id);

        // Create a map of childSubdocId to child name from userData
        const childNameMap = new Map<string, string>();
        userData.children.forEach((child: { _id: string; firstName: string; lastName: string }) => {
          childNameMap.set(child._id, `${child.firstName} ${child.lastName}`);
        });

        // Group waivers by user and children
        const grouped: GroupedWaivers = {
          user: [],
          children: {},
        };

        // Process each waiver and categorize it correctly
        signedWaivers.forEach((signedWaiver) => {
          const event: RegisteredEvent = {
            id: signedWaiver.waiver._id,
            eventName: signedWaiver.event.title,
            startDateTime: new Date(signedWaiver.event.startDate),
            endDateTime: new Date(signedWaiver.event.endDate),
            signatureDate: new Date(signedWaiver.waiver.uploadedAt),
            fileKey: signedWaiver.waiver.fileKey,
          };

          // Check if this waiver is for a child
          if (signedWaiver.waiver.isForChild && signedWaiver.waiver.childSubdocId) {
            const childId = signedWaiver.waiver.childSubdocId;
            const childName = childNameMap.get(childId) || "Unknown Child";

            event.childId = childId;
            event.childName = childName;

            // Initialize the child's entry if it doesn't exist
            if (!grouped.children[childId]) {
              grouped.children[childId] = {
                name: childName,
                waivers: [],
              };
            }

            // Add the waiver to the child's list
            grouped.children[childId].waivers.push(event);
          } else {
            // This is a user's waiver
            grouped.user.push(event);
          }
        });

        // Sort waivers by date (newest first)
        grouped.user.sort((a, b) => b.signatureDate.getTime() - a.signatureDate.getTime());

        // Sort each child's waivers
        Object.keys(grouped.children).forEach((childId) => {
          grouped.children[childId].waivers.sort((a, b) => b.signatureDate.getTime() - a.signatureDate.getTime());
        });

        setGroupedWaivers(grouped);
      } catch (error: any) {
        console.error("Failed to fetch signed waivers:", error);
        setError(error.message || "Failed to load waivers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedWaiversData();
  }, [isLoaded, user]);

  const handleViewWaiver = async (fileKey: string, eventName: string) => {
    try {
      setCurrentWaiverTitle(eventName);

      // Fetch the presigned URL using the fileKey
      const presignedResponse = await fetch(`/api/s3/presigned-download?fileKey=${encodeURIComponent(fileKey)}`, {
        method: "GET",
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to fetch presigned URL");
      }

      const presignedData = await presignedResponse.json();
      setCurrentWaiverUrl(presignedData.url);
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error("Failed to view waiver:", error);
      setError(error.message || "Failed to load waiver");
    }
  };

  // Count total waivers
  const getTotalWaivers = () => {
    if (!groupedWaivers) return 0;

    const userCount = groupedWaivers.user.length;
    const childrenCount = Object.values(groupedWaivers.children).reduce(
      (total, child) => total + child.waivers.length,
      0,
    );

    return userCount + childrenCount;
  };

  // Count total children with waivers
  const getChildrenCount = () => {
    if (!groupedWaivers) return 0;
    return Object.keys(groupedWaivers.children).length;
  };

  // Loading state
  if (isLoading || !isLoaded || !user || groupedWaivers === null) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Past Signed Waivers</h1>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Loading waivers...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border bg-card shadow-sm">
          <div className="border-b bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-5 w-1 bg-primary" />
              <h2 className="text-xl font-semibold">Your Waivers</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, idx) => (
                <WaiverSignatureSkeleton key={`user-${idx}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-5 w-1 bg-primary" />
              <h2 className="text-xl font-semibold">Children&apos;s Waivers</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[...Array(2)].map((_, childIdx) => (
                <div key={`child-group-${childIdx}`} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="space-y-4 border-l-2 border-muted pl-4">
                    {[...Array(2)].map((_, waiverIdx) => (
                      <WaiverSignatureSkeleton key={`child-${childIdx}-waiver-${waiverIdx}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Waivers
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasUserWaivers = groupedWaivers.user.length > 0;
  const hasChildrenWaivers = Object.keys(groupedWaivers.children).length > 0;
  const totalWaivers = getTotalWaivers();
  const childrenCount = getChildrenCount();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Past Signed Waivers</h1>
          <p className="mt-1 text-muted-foreground">View and manage your signed event waivers</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg bg-muted/80 p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {totalWaivers} {totalWaivers === 1 ? "Waiver" : "Waivers"} on Record
              </span>
            </div>
          </div>

          {hasChildrenWaivers && (
            <div className="rounded-lg bg-muted/80 p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {childrenCount} {childrenCount === 1 ? "Child" : "Children"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-6 flex w-fit max-w-[100vw] flex-col flex-wrap gap-2 sm:flex-row sm:gap-0">
          {isMobile ? (
            <>
              <TabsTrigger value="all" className="flex w-full items-center gap-2 sm:w-auto">
                <FileText className="h-4 w-4" />
                <span>All Waivers</span>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="all" className="flex w-full items-center gap-2 sm:w-auto">
                <FileText className="h-4 w-4" />
                <span>All Waivers</span>
              </TabsTrigger>
              <TabsTrigger value="user" className="flex w-full items-center gap-2 sm:w-auto">
                <User className="h-4 w-4" />
                <span>Your Waivers</span>
              </TabsTrigger>
              <TabsTrigger value="children" className="flex w-full items-center gap-2 sm:w-auto">
                <Users className="h-4 w-4" />
                <span>Children&apos;s Waivers</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {totalWaivers === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/60" />
                <h2 className="text-xl font-semibold text-muted-foreground">No signed waivers found</h2>
                <p className="mt-2 max-w-md text-center text-muted-foreground">
                  Waivers you sign for events will appear here. You&apos;ll be able to view your signed waivers at any
                  time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {hasUserWaivers && (
                <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
                  <div className="border-b bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        Your Waivers
                        <Badge variant="secondary" className="ml-2">
                          {groupedWaivers.user.length}
                        </Badge>
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-4">
                      {groupedWaivers.user.map((event) => (
                        <WaiverSignatureComponent
                          key={event.id}
                          eventName={event.eventName}
                          startDateTime={event.startDateTime}
                          endDateTime={event.endDateTime}
                          signed={true}
                          signatureDate={event.signatureDate}
                          onViewWaiver={() => handleViewWaiver(event.fileKey, event.eventName)}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {hasChildrenWaivers && (
                <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
                  <div className="border-b bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        Children&apos;s Waivers
                        <Badge variant="secondary" className="ml-2">
                          {childrenCount}
                        </Badge>
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedWaivers.children).map(([childId, child]) => (
                        <AccordionItem key={childId} value={childId} className="mb-4 border-b-0">
                          <AccordionTrigger className="rounded-lg bg-muted/20 px-4 py-3 hover:bg-muted/40 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{child.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {child.waivers.length} {child.waivers.length === 1 ? "waiver" : "waivers"}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pt-4">
                            <div className="flex flex-col gap-4 border-l-2 border-muted pl-4">
                              {child.waivers.map((event) => (
                                <WaiverSignatureComponent
                                  key={event.id}
                                  eventName={event.eventName}
                                  startDateTime={event.startDateTime}
                                  endDateTime={event.endDateTime}
                                  signed={true}
                                  signatureDate={event.signatureDate}
                                  onViewWaiver={() => handleViewWaiver(event.fileKey, event.eventName)}
                                  childName={child.name}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="user">
          <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
            <div className="border-b bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Your Waivers
                  <Badge variant="secondary" className="ml-2">
                    {groupedWaivers.user.length}
                  </Badge>
                </h2>
              </div>
            </div>
            <div className="p-6">
              {groupedWaivers.user.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CircleCheck className="mb-4 h-12 w-12 text-muted-foreground/60" />
                  <p className="text-muted-foreground">No personal waivers found</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground/80">
                    When you sign waivers for events you&apos;re attending, they&apos;ll appear here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {groupedWaivers.user.map((event) => (
                    <WaiverSignatureComponent
                      key={event.id}
                      eventName={event.eventName}
                      startDateTime={event.startDateTime}
                      endDateTime={event.endDateTime}
                      signed={true}
                      signatureDate={event.signatureDate}
                      onViewWaiver={() => handleViewWaiver(event.fileKey, event.eventName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="children">
          {!hasChildrenWaivers ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/60" />
                <h2 className="text-xl font-semibold text-muted-foreground">No Children&apos;s Waivers Found</h2>
                <p className="mt-2 max-w-md text-center text-muted-foreground">
                  Waivers signed for your children will appear here. You can view and manage all your children&apos;s
                  waivers in one place.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedWaivers.children).map(([childId, child]) => (
                <Card key={childId} className="overflow-hidden border-t-4 border-t-primary shadow-sm">
                  <div className="border-b bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        {child.name}&apos;s Waivers
                        <Badge variant="secondary" className="ml-2">
                          {child.waivers.length}
                        </Badge>
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-4">
                      {child.waivers.map((event) => (
                        <WaiverSignatureComponent
                          key={event.id}
                          eventName={event.eventName}
                          startDateTime={event.startDateTime}
                          endDateTime={event.endDateTime}
                          signed={true}
                          signatureDate={event.signatureDate}
                          onViewWaiver={() => handleViewWaiver(event.fileKey, event.eventName)}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Waiver Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[95vw] rounded-md" : "max-w-4xl rounded-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {currentWaiverTitle}
            </DialogTitle>
            <DialogDescription>Signed waiver document</DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-hidden rounded-md border">
            {isMobile ? (
              currentWaiverUrl ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-md bg-muted/20 p-6">
                  <p className="text-center text-sm text-muted-foreground">
                    For the best viewing experience on mobile, please open the waiver document in a new tab.
                  </p>
                  <Button
                    onClick={() => window.open(currentWaiverUrl, "_blank", "noopener,noreferrer")}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Waiver in New Tab
                  </Button>
                </div>
              ) : (
                <div className="flex h-[30vh] items-center justify-center bg-muted/10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading document...</p>
                  </div>
                </div>
              )
            ) : currentWaiverUrl ? (
              <iframe
                src={currentWaiverUrl}
                title="Waiver Preview"
                className="h-[70vh] w-full rounded-md border-none"
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
