"use client";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";

function testfunc() {}

export default function Page() {
  return (
    <WaiverSignatureForm
      eventID="1"
      waiverID="1"
      participants={[
        { firstName: "James", lastName: "Hudson", userID: "e" },
        { firstName: "Ava", lastName: "Hudson", userID: "2" },
      ]}
    ></WaiverSignatureForm>
  );
}
