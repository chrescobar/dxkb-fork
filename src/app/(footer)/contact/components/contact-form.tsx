import { Separator } from "@/components/ui/separator";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { SiX, SiGithub } from "@icons-pack/react-simple-icons";
import LinkedInIcon from "@/components/icons/linkedin-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ContactForm = () => {
  return (
    <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Contact Info Sidebar */}
              <div className="md:col-span-1">
                <div className="sticky top-24">
                  <h2 className="mb-6 text-xl font-bold">Contact Information</h2>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-4 rounded-full bg-secondary/20 p-3">
                        <Mail className="size-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-medium">Email</h3>
                        <a href="mailto:contact@virusdb.org" className="text-link hover:underline">
                          contact@virusdb.org
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-4 rounded-full bg-secondary/20 p-3">
                        <Phone className="size-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-medium">Phone</h3>
                        <a href="tel:+18005551234" className="text-link hover:underline">
                          +1 (800) 555-1234
                        </a>
                        <p className="mt-1 text-sm text-muted-foreground">Mon-Fri, 9am-5pm EST</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-4 rounded-full bg-secondary/20 p-3">
                        <MapPin className="size-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-medium">Main Office</h3>
                        <p className="text-muted-foreground">123 Science Way, Cambridge, MA 02142, USA</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  <h3 className="mb-4 font-medium">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      aria-label="Follow us on X (Twitter)"
                      className="flex size-11 items-center justify-center rounded-full bg-accent/20 transition-colors duration-200 hover:bg-accent/40"
                    >
                      <SiX className="size-5 text-accent" aria-hidden="true" />
                    </a>
                    <a
                      href="#"
                      aria-label="Follow us on LinkedIn"
                      className="flex size-11 items-center justify-center rounded-full bg-accent/20 transition-colors duration-200 hover:bg-accent/40"
                    >
                      <LinkedInIcon className="size-5 text-accent" aria-hidden="true" />
                    </a>
                    <a
                      href="#"
                      aria-label="Follow us on GitHub"
                      className="flex size-11 items-center justify-center rounded-full bg-accent/20 transition-colors duration-200 hover:bg-accent/40"
                    >
                      <SiGithub className="size-5 text-accent" aria-hidden="true" />
                    </a>
                  </div>

                  <Separator className="my-8" />

                  <div className="rounded-lg bg-secondary/20 p-6">
                    <h3 className="mb-2 font-medium">Support Hours</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Clock className="mr-2 size-4 text-secondary" />
                        <span className="text-sm">Monday - Friday: 9:00 AM - 5:00 PM (EST)</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 size-4 text-secondary" />
                        <span className="text-sm">Saturday: 10:00 AM - 2:00 PM (EST)</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 size-4 text-secondary" />
                        <span className="text-sm">Sunday: Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardContent className="px-8 py-4">
                    <h2 className="mb-6 text-xl font-bold">Send Us a Message</h2>
                    <form className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="inquiry-type" className="text-base font-medium">
                            What can we help you with?
                          </Label>
                          <RadioGroup defaultValue="general" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="general" id="general" />
                              <Label htmlFor="general" className="font-normal">
                                General Inquiry
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="technical" id="technical" />
                              <Label htmlFor="technical" className="font-normal">
                                Technical Support
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="research" id="research" />
                              <Label htmlFor="research" className="font-normal">
                                Research Collaboration
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="feedback" id="feedback" />
                              <Label htmlFor="feedback" className="font-normal">
                                Feedback & Suggestions
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                              Full Name
                            </Label>
                            <Input id="name" placeholder="Enter your full name" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                              Email Address
                            </Label>
                            <Input id="email" type="email" placeholder="Enter your email address" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="institution" className="text-sm font-medium">
                              Institution/Organization
                            </Label>
                            <Input id="institution" placeholder="Enter your institution or organization" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                              Phone Number (Optional)
                            </Label>
                            <Input id="phone" placeholder="Enter your phone number" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-medium">
                            Subject
                          </Label>
                          <Input id="subject" placeholder="Enter the subject of your message" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-medium">
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            placeholder="Please provide details about your inquiry..."
                            rows={6}
                          />
                        </div>

                        <div className="flex items-start space-x-2">
                          <input type="checkbox" id="privacy" className="mt-1" />
                          <Label htmlFor="privacy" className="text-sm font-normal">
                            I agree to the
                            <a href="#" className="text-link hover:underline">
                              Privacy Policy
                            </a>
                            and consent to the processing of my personal data.
                          </Label>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button className="w-full bg-secondary py-6 hover:bg-secondary">Submit Message</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

export default ContactForm