import ContactForm from "./components/contact-form";
import FooterHeader from "@/components/headers/footer-header";

const ContactUs = () => {
  return (
    <div>
      <FooterHeader title="Contact Us" />

      {/* Contact Form Section */}
      <ContactForm />
    </div>
  )
}

export default ContactUs