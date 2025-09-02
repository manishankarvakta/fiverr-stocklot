import React, { useState } from 'react';
import { 
  Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '../ui';
import { Lightbulb, Plus, Send } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SuggestButton({ compact = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setKind('');
    setTitle('');
    setDetails('');
    setSpecies('');
    setBreed('');
    setEmail('');
    setConsent(false);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!kind || !title.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/suggestions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind,
          title: title.trim(),
          details: details.trim() || null,
          species: species.trim() || null,
          breed: breed.trim() || null,
          contact_email: email.trim() || null,
          consent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit suggestion');
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert(error.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = kind && title.trim();

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Thank You!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-gray-600">
              Your suggestion has been submitted successfully. We'll review it shortly and get back to you!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button 
        variant={compact ? 'ghost' : 'secondary'} 
        size={compact ? 'sm' : 'default'}
        onClick={() => setOpen(true)}
        className={`${compact ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} ${className}`}
      >
        <Lightbulb className="h-4 w-4 mr-2" />
        Suggest Function or Additions
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">Suggest Function or Additions</DialogTitle>
            <DialogDescription>
              Help us improve StockLot by suggesting new animals, features, or reporting issues.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            {/* Type and Title Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kind" className="text-sm font-medium">Type *</Label>
                <Select value={kind || ""} onValueChange={setKind}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANIMAL">🐄 Animals/Breeds to add</SelectItem>
                    <SelectItem value="FEATURE">✨ New feature</SelectItem>
                    <SelectItem value="BUG">🐛 Bug / issue</SelectItem>
                    <SelectItem value="OTHER">💡 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  placeholder="Short summary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Species and Breed (only for ANIMAL type) */}
            {kind === 'ANIMAL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="species" className="text-sm font-medium">Species (optional)</Label>
                  <Input
                    id="species"
                    placeholder="e.g. Ostrich, Tilapia, Quail"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="breed" className="text-sm font-medium">Breed (optional)</Label>
                  <Input
                    id="breed"
                    placeholder="e.g. Dorper, Boer, Ross 308"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              <Label htmlFor="details" className="text-sm font-medium">Details</Label>
              <Textarea
                id="details"
                rows={4}
                placeholder="Describe the animal/feature/issue and why it would be valuable for our livestock marketplace..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* Email (optional) */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email (optional, for updates)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Consent checkbox */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed">
                I agree to be contacted about this suggestion and understand it will be reviewed by the StockLot team.
              </Label>
            </div>

            {/* Info alert */}
            <Alert className="bg-emerald-50 border-emerald-200">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                Your suggestions help us build a better livestock marketplace for South African farmers and buyers.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Suggestion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}