import { Button } from "@/components/ui/button";
type Participant = {
  firstName: string;
  lastName: string;
  userID: string;
  isChild: boolean;
};

type SignatureCanvasProps = {
  eventId: string;
  waiverId: string;
  fileKey: string;
  participants: Participant[];
  onSigned: () => void;
};

export default function SignatureCanvas(props: SignatureCanvasProps) {
  const handleSign = async () => {
    props.onSigned();
  };
  return (
    <div className="h-[200px] w-[400px] border">
      <Button onClick={handleSign}>Sign Waiver</Button>
    </div>
  );
}
