"use client";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";

function testfunc() {}

export default function Page() {
  return <WaiverSignatureForm participantType="child" waiverId="1" onSigned={testfunc}></WaiverSignatureForm>;
}
