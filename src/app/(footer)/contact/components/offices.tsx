import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

const Offices = () => {
  return (
    <section className="bg-background py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-8 text-center text-2xl font-bold">Visit Our Offices</h2>
              <div className="mb-8 h-96 overflow-hidden rounded-lg bg-gray-200">
                {/* This would be replaced with an actual map component */}
                <div className="flex size-full items-center justify-center bg-gray-300">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 size-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive Map Would Be Displayed Here</p>
                    <Button variant="outline" className="mt-4">
                      <ExternalLink className="mr-2 size-4" />
                      View Full Map
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-background p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-bold">Cambridge, MA</h3>
                  <p className="mb-4 text-muted-foreground">123 Science Way, Cambridge, MA 02142, USA</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Get Directions
                  </Button>
                </div>

                <div className="rounded-lg bg-background p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-bold">Oxford, UK</h3>
                  <p className="mb-4 text-muted-foreground">45 Research Boulevard, Oxford, UK OX1 2JD</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Get Directions
                  </Button>
                </div>

                <div className="rounded-lg bg-background p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-bold">Singapore</h3>
                  <p className="mb-4 text-muted-foreground">78 Innovation Road, Singapore 138632</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
  )
}

export default Offices