"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSignedWaiversForRegisteredEvents } from "@/app/actions/waivers/action";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import WaiverSignatureSkeleton from "@/components/WaiverSignatureComponent/WaiverSignatureSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, User, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMobileDetection from "@/hooks/useMobileDetection";

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
      <div className="container mx-auto overflow-x-hidden px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Past Signed Waivers</h1>
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold">Your Waivers</h2>
          <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, idx) => (
              <WaiverSignatureSkeleton key={`user-${idx}`} />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Children&apos;s Waivers</h2>
          <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, idx) => (
              <WaiverSignatureSkeleton key={`child-${idx}`} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-[100vw] overflow-x-hidden p-6">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Waivers</h1>
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    );
  }

  const hasUserWaivers = groupedWaivers.user.length > 0;
  const hasChildrenWaivers = Object.keys(groupedWaivers.children).length > 0;
  const totalWaivers = getTotalWaivers();
  const childrenCount = getChildrenCount();

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Past Signed Waivers</h1>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg bg-muted p-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {totalWaivers} {totalWaivers === 1 ? "Waiver" : "Waivers"} on Record
              </span>
            </div>
          </div>

          {hasChildrenWaivers && (
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {childrenCount} {childrenCount === 1 ? "Child" : "Children"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-4 flex w-fit max-w-[100vw] flex-col flex-wrap gap-2 sm:flex-row sm:gap-0">
          {isMobile ? (
            <>
              <TabsTrigger value="all" className="flex w-full items-center gap-2 sm:w-auto">
                <User className="h-4 w-4" />
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
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">No signed waivers found</h2>
              <p className="mt-2 text-muted-foreground">Waivers you sign for events will appear here.</p>
            </Card>
          ) : (
            <>
              {hasUserWaivers && (
                <Card className="overflow-hidden">
                  <div className="bg-primary/5 p-4">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <User className="h-5 w-5" />
                      Your Waivers ({groupedWaivers.user.length})
                    </h2>
                  </div>
                  <div className="p-4">
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
                <Card className="overflow-hidden">
                  <div className="bg-primary/5 p-4">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Users className="h-5 w-5" />
                      Children&apos;s Waivers
                    </h2>
                  </div>
                  <div className="p-4">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedWaivers.children).map(([childId, child]) => (
                        <AccordionItem key={childId} value={childId}>
                          <AccordionTrigger className="py-4 text-lg font-medium hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span>{child.name}</span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                                {child.waivers.length} {child.waivers.length === 1 ? "waiver" : "waivers"}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col gap-4 pt-2">
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
          <Card className="overflow-hidden">
            <div className="bg-primary/5 p-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <User className="h-5 w-5" />
                Your Waivers ({groupedWaivers.user.length})
              </h2>
            </div>
            <div className="p-4">
              {groupedWaivers.user.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No personal waivers found</p>
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
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">No Children&apos;s Waivers Found</h2>
              <p className="mt-2 text-muted-foreground">Waivers signed for your children will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedWaivers.children).map(([childId, child]) => (
                <Card key={childId} className="overflow-hidden">
                  <div className="bg-primary/5 p-4">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <User className="h-5 w-5" />
                      {child.name}&apos;s Waivers ({child.waivers.length})
                    </h2>
                  </div>
                  <div className="p-4">
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
        <DialogContent className={isMobile ? "max-w-[90vw] rounded-md" : "max-w-4xl rounded-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {currentWaiverTitle}
            </DialogTitle>
            <DialogDescription>Signed waiver document</DialogDescription>
          </DialogHeader>
          <div className="mt-4 rounded-md border">
            {isMobile ? (
              currentWaiverUrl ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-md p-4">
                  <p className="text-center text-sm text-gray-600">
                    For the best viewing experience on mobile, please open the waiver document in a new tab.
                  </p>
                  <Button
                    onClick={() => window.open(currentWaiverUrl, "_blank", "noopener,noreferrer")}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Waiver in New Tab
                  </Button>
                </div>
              ) : (
                <div className="flex h-[30vh] items-center justify-center">
                  <p>Loading document...</p>
                </div>
              )
            ) : currentWaiverUrl ? (
              <iframe
                src={currentWaiverUrl}
                title="Waiver Preview"
                className="h-[70vh] w-full rounded-md border-none"
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center">
                <p>Loading document...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
