"use client";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";

function testfunc() {}

export default function Page() {
  return (
    <WaiverSignatureForm
      eventId="6813445539132eb8cd0958ab"
      participants={[
        { firstName: "James", lastName: "Hudson", userID: "6816d463c43dbce290295172", isChild: true },
        { firstName: "Ava", lastName: "Hudson", userID: "6816d463c43dbce290295173", isChild: true },
      ]}
      setRegistrationState={() => console.log("redirecting...")}
    ></WaiverSignatureForm>
  );
}
