"use client";

import { useState, useEffect } from "react";
import { Search, UserCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration - in a real app, you would fetch this from your API
const mockEvents = [
  {
    id: "event_1",
    name: "Summer Camp 2023",
    description: "A fun summer camp for kids ages 7-12",
    startDate: new Date("2023-07-10"),
    endDate: new Date("2023-07-24"),
    location: "Camp Wilderness, 123 Forest Rd",
  },
  {
    id: "event_2",
    name: "Fall Workshop 2023",
    description: "Arts and crafts workshop for all ages",
    startDate: new Date("2023-09-15"),
    endDate: new Date("2023-09-17"),
    location: "Community Center, 456 Main St",
  },
];

const mockUsers = [
  {
    id: "1",
    clerkID: "user_123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    gender: "Male",
    birthday: new Date("1985-05-15"),
    phoneNumbers: {
      cell: "555-123-4567",
      work: "555-765-4321",
    },
    address: {
      home: "123 Main St",
      city: "Anytown",
      zipCode: "12345",
    },
    children: [
      {
        id: "child_1",
        firstName: "Emma",
        lastName: "Doe",
        birthday: new Date("2015-03-10"),
        gender: "Female",
        emergencyContacts: [
          {
            name: "Jane Doe",
            phone: "555-987-6543",
            relationship: "Mother",
            canPickup: true,
          },
        ],
        medicalInfo: {
          allergies: "Peanuts",
          dietaryRestrictions: "Vegetarian",
        },
      },
    ],
    registeredEvents: ["event_1", "event_2"],
    emergencyContacts: [
      {
        name: "Jane Doe",
        phone: "555-987-6543",
        relationship: "Spouse",
        canPickup: true,
      },
    ],
  },
  {
    id: "2",
    clerkID: "user_456",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    gender: "Female",
    birthday: new Date("1990-08-22"),
    phoneNumbers: {
      cell: "555-222-3333",
      work: "",
    },
    address: {
      home: "456 Oak Ave",
      city: "Somewhere",
      zipCode: "67890",
    },
    children: [
      {
        id: "child_2",
        firstName: "Michael",
        lastName: "Johnson",
        birthday: new Date("2018-11-05"),
        gender: "Male",
        emergencyContacts: [],
        medicalInfo: {
          allergies: "None",
          dietaryRestrictions: "",
        },
      },
      {
        id: "child_3",
        firstName: "Olivia",
        lastName: "Johnson",
        birthday: new Date("2016-07-15"),
        gender: "Female",
        emergencyContacts: [],
        medicalInfo: {
          allergies: "Dairy",
          dietaryRestrictions: "Lactose-free",
        },
      },
    ],
    registeredEvents: ["event_1"],
    emergencyContacts: [
      {
        name: "Robert Johnson",
        phone: "555-444-5555",
        relationship: "Father",
        canPickup: true,
      },
    ],
  },
];

export default function EventParticipantsPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // In a real app, you would fetch event and participant data from your API
  useEffect(() => {
    // Simulate API call to get event details
    const eventData = mockEvents.find((e) => e.id === params.eventId);
    setEvent(mockEvents[0]);

    // Simulate API call to get participants for this event
    const eventParticipants = mockUsers.filter((user) => user.registeredEvents.includes(params.eventId));
    setParticipants(mockUsers);
  }, [params.eventId]);

  // Filter participants based on search term
  const filteredParticipants = participants.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!event) {
    return <div className="container mx-auto py-6">Loading event details...</div>;
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.name} - Participants</h1>
          <p className="text-muted-foreground">
            {event.startDate.toLocaleDateString()} to {event.endDate.toLocaleDateString()} at {event.location}
          </p>
        </div>
        <Button>Export Participant List</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Participants</CardTitle>
          <CardDescription>Find participants by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants List</CardTitle>
          <CardDescription>{filteredParticipants.length} participants registered</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Children</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((user) => (
                <ParticipantRow key={user.id} user={user} />
              ))}
            </TableBody>
          </Table>

          {filteredParticipants.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">No participants found matching your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantRow({ user }) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Collapsible className="w-full">
            <CollapsibleTrigger className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
              {({ open }) => (open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="rounded-md bg-muted/50 p-4">
                <Tabs defaultValue="personal">
                  <TabsList className="mb-4">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="children">Children ({user.children.length})</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <InfoCard title="Personal Details">
                        <InfoItem label="Full Name" value={`${user.firstName} ${user.lastName}`} />
                        <InfoItem label="Gender" value={user.gender} />
                        <InfoItem label="Birthday" value={user.birthday.toLocaleDateString()} />
                        <InfoItem label="Email" value={user.email} />
                      </InfoCard>

                      <InfoCard title="Contact Information">
                        <InfoItem label="Cell Phone" value={user.phoneNumbers.cell} />
                        {user.phoneNumbers.work && <InfoItem label="Work Phone" value={user.phoneNumbers.work} />}
                      </InfoCard>

                      <InfoCard title="Address">
                        <InfoItem label="Street" value={user.address.home} />
                        <InfoItem label="City" value={user.address.city} />
                        <InfoItem label="Zip Code" value={user.address.zipCode} />
                      </InfoCard>
                    </div>
                  </TabsContent>

                  <TabsContent value="children">
                    {user.children.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {user.children.map((child) => (
                          <Card key={child.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {child.firstName} {child.lastName}
                              </CardTitle>
                              <CardDescription>
                                {child.birthday
                                  ? `${child.gender} · ${child.birthday.toLocaleDateString()}`
                                  : child.gender}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {child.medicalInfo.allergies && (
                                <div>
                                  <h4 className="mb-1 text-sm font-medium">Allergies</h4>
                                  <p className="text-sm">{child.medicalInfo.allergies}</p>
                                </div>
                              )}

                              {child.medicalInfo.dietaryRestrictions && (
                                <div>
                                  <h4 className="mb-1 text-sm font-medium">Dietary Restrictions</h4>
                                  <p className="text-sm">{child.medicalInfo.dietaryRestrictions}</p>
                                </div>
                              )}

                              {child.emergencyContacts && child.emergencyContacts.length > 0 && (
                                <div>
                                  <h4 className="mb-1 text-sm font-medium">Emergency Contacts</h4>
                                  {child.emergencyContacts.map((contact, i) => (
                                    <div key={i} className="text-sm">
                                      {contact.name} ({contact.relationship}) - {contact.phone}
                                      {contact.canPickup && <span className="ml-1 text-green-600">(Can pickup)</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No children registered</p>
                    )}
                  </TabsContent>

                  <TabsContent value="emergency">
                    {user.emergencyContacts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {user.emergencyContacts.map((contact, i) => (
                          <InfoCard key={i} title={`Contact ${i + 1}`}>
                            <InfoItem label="Name" value={contact.name} />
                            <InfoItem label="Phone" value={contact.phone} />
                            <InfoItem label="Relationship" value={contact.relationship} />
                            <InfoItem
                              label="Can Pickup"
                              value={contact.canPickup ? "Yes" : "No"}
                              valueClassName={contact.canPickup ? "text-green-600" : "text-red-600"}
                            />
                          </InfoCard>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No emergency contacts listed</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
            <span>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.phoneNumbers.cell}</TableCell>
        <TableCell>
          <Badge>{user.children.length}</Badge>
        </TableCell>
      </TableRow>
    </>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-md border bg-white p-4 dark:bg-gray-800">
      <h3 className="mb-2 font-medium">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, valueClassName = "" }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}
