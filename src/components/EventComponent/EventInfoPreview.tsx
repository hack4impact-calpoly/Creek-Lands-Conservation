import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Text, Image } from "lucide-react";

export function EventInfoPreview() {
  const images = [
    "https://cdn.recreation.gov/public/images/66783.jpg",
    "https://cdn.recreation.gov/public/images/66783.jpg",
    "https://cdn.recreation.gov/public/images/66783.jpg",
    "https://cdn.recreation.gov/public/images/66783.jpg",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Event Details</Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-w-[90%] rounded-lg md:w-auto md:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-center text-4xl">SLO Wild Hike</DialogTitle>
        </DialogHeader>
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar]:w-2">
          <div className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Calendar className="h-5 w-5" />
              <h1>Saturday January 18, 2025</h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Clock className="h-5 w-5" />
              <h1>10:00 am - 12:30 pm</h1>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <MapPin className="h-5 w-5" />
              <h1>Stenner Creek Trailhead</h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Mail className="h-5 w-5" />
              <h1>info@creeklands.org</h1>
            </div>
          </div>

          <div className="grid items-start gap-4 py-4 sm:grid-cols-[auto_1fr]">
            <Text className="h-5 w-5" />
            <p>
              Join us for a hike led by Tim Delaney, Restoration Hydrologist at Creek Lands Conservation! Delve into the
              wonders of the SLO Creek Watershed, exploring its captivating geology, hydrology, and diverse habitats.
              We&apos;ll uncover medicinal and edible plants, examine geological formations, and discover the importance
              of natural springs in sustaining aquatic life. From streamflow measurements to benthic macroinvertebrate
              sampling (or &quot;water bug catching&quot; in plain English), there&apos;s something for everyone to
              explore. This is a kid-friendly event. Meet at the dirt parking lot of Stenner Creek trailhead at 10 am.
              The hike is approximately 2 miles round trip with about 350 feet of elevation gain at the top. Bring your
              curiosity and hiking essentials, and let&apos;s dive into the beauty of nature together!
            </p>
          </div>

          <br />

          <div className="grid items-start gap-4 py-4 sm:grid-cols-[auto_1fr]">
            <Image alt="Image Icon" className="h-5 w-5" />
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto py-4">
              {images.map((src, index) => (
                <div key={index} className="flex-shrink-0">
                  <img src={src} alt={`Image ${index + 1}`} className="h-auto w-64 rounded-lg object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
