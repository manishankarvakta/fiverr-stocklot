import React, { useState } from 'react';
import { Card, CardContent, Button, Input, Label, Textarea } from '@/components/ui';
import { Mail, Clock } from 'lucide-react';
import Header from '@/components/ui/common/Header';
import Footer from '@/components/ui/common/Footer';
import { useSubmitContactFormMutation } from '@/store/api/contact.api';

function Contact() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitContactForm, { isLoading: isSubmitting }] = useSubmitContactFormMutation();

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      await submitContactForm({
        ...contactForm,
        to_email: 'hello@stocklot.farm'
      }).unwrap();
      
      alert('Message sent successfully! We\'ll get back to you soon.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Failed to send message. Please email us directly at hello@stocklot.farm');
    }
  };

  const handleInputChange = (field, value) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">Contact Us</h1>
            <p className="text-xl text-emerald-700">Get in touch with the StockLot team</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-emerald-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Get In Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">hello@stocklot.farm</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">24/7 Customer Support</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Quick Support</h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                      onClick={() => window.location.href = '/marketplace'}
                    >
                      Browse Marketplace
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => window.location.href = '/how-it-works'}
                    >
                      How It Works
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Send a Message</h2>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-emerald-700">Name</Label>
                    <Input 
                      id="name" 
                      value={contactForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-emerald-700">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={contactForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-emerald-700">Subject</Label>
                    <Input 
                      id="subject" 
                      value={contactForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-emerald-700">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={4} 
                      value={contactForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Contact;

