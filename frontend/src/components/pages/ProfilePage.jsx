// Profile Settings Page
function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [farmPhotos, setFarmPhotos] = useState([]);
  const [profileOptions, setProfileOptions] = useState({});
  const [completionScore, setCompletionScore] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');

  // Determine user roles for conditional rendering
  const userRoles = user?.roles || ['buyer'];
  const isBuyer = userRoles.includes('buyer');
  const isSeller = userRoles.includes('seller');
  const isDualRole = isBuyer && isSeller;

  useEffect(() => {
    if (user) {
      setProfile(user);
      setProfilePhoto(user.profile_photo || null);
      setFarmPhotos(user.farm_photos || []);
      setCompletionScore(user.profile_completion_score || 0);
    }
    fetchProfileOptions();
  }, [user]);

  const fetchProfileOptions = async () => {
    try {
      const response = await fetch('/api/profile/options');
      const data = await response.json();
      setProfileOptions(data);
    } catch (error) {
      console.error('Error fetching profile options:', error);
    }
  };

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (response.ok) {
        setProfile(result.user);
        setCompletionScore(result.profile_completion);
        alert('Profile updated successfully!');
      } else {
        throw new Error(result.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile: ' + error.message);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG)');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePhoto(result.photo_url);
        alert('Profile photo updated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFarmPhotosUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/farm-photos', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setFarmPhotos(prev => [...prev, ...result.photo_urls]);
        alert('Farm photos uploaded successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Farm photos upload error:', error);
      alert('Failed to upload farm photos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateArrayField = (fieldName, value, isChecked) => {
    setProfile(prev => {
      const currentArray = prev[fieldName] || [];
      if (isChecked) {
        return { ...prev, [fieldName]: [...currentArray, value] };
      } else {
        return { ...prev, [fieldName]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const ProfileCompletionIndicator = () => (
    <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-emerald-900">Profile Completion</h3>
        <span className="text-2xl font-bold text-emerald-600">{completionScore}%</span>
      </div>
      <div className="w-full bg-emerald-100 rounded-full h-4 mb-4">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-green-500 h-4 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${completionScore}%` }}
        ></div>
      </div>
      <p className="text-sm text-emerald-700 leading-relaxed">
        {isDualRole ? "Complete both buyer and seller sections for maximum trust!" :
         isSeller ? (completionScore < 50 ? "Complete your seller profile to build buyer trust!" :
                     completionScore < 80 ? "Great seller profile! Add more details to stand out." :
                     "Excellent! Your seller profile looks professional and complete.") :
         (completionScore < 50 ? "Complete your buyer profile to access premium livestock!" :
          completionScore < 80 ? "Good buyer profile! Add more details to gain seller trust." :
          "Excellent! Sellers will trust you as a reliable buyer.")}
      </p>
    </div>
  );

  // Dynamic tab configuration based on user roles
  const getTabsForRole = () => {
    const commonTabs = [
      { value: 'basic', label: 'Basic Info' }
    ];

    if (isSeller) {
      commonTabs.push(
        { value: 'seller-business', label: 'Business' },
        { value: 'seller-expertise', label: 'Expertise' },
        { value: 'photos', label: 'Photos' },
        { value: 'seller-policies', label: 'Policies' }
      );
    }

    if (isBuyer) {
      commonTabs.push(
        { value: 'buyer-preferences', label: 'Buying Prefs' },
        { value: 'buyer-facility', label: 'Facility Info' },
        { value: 'buyer-experience', label: 'Experience' }
      );
    }

    return commonTabs;
  };

  const tabConfig = getTabsForRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900">
                {isDualRole ? 'Buyer & Seller Profile Settings' : 
                 isSeller ? 'Seller Profile Settings' : 
                 'Buyer Profile Settings'}
              </CardTitle>
              <CardDescription>
                {isDualRole ? 'Build comprehensive buyer and seller profiles for maximum marketplace trust' :
                 isSeller ? 'Build a comprehensive seller profile to gain buyer trust' :
                 'Build a comprehensive buyer profile to access premium livestock and gain seller trust'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileCompletionIndicator />
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Improved Horizontal Tab Layout */}
                <div className="mb-8">
                  <TabsList className="w-full h-auto p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                      {tabConfig.map(tab => (
                        <TabsTrigger 
                          key={tab.value} 
                          value={tab.value}
                          className="flex-1 py-3 px-4 text-sm font-medium text-center rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 whitespace-nowrap"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </div>

                {/* Basic Information Tab - Common to all users */}
                <TabsContent value="basic" className="space-y-6">
                  {/* Profile Photo Section - Improved Spacing */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-32 w-32 flex-shrink-0">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl font-bold">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Upload Photo</h4>
                          <p className="text-sm text-gray-600 mb-3">Professional photo builds trust (JPG, PNG up to 5MB)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('photo-upload').click()}
                            disabled={uploading}
                            className="min-w-[120px]"
                          >
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Complete both buyer and seller sections for maximum trust!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input 
                        id="full_name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        placeholder="Your legal name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={profile.email || ''}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_name">{isSeller ? 'Business/Farm Name' : 'Business/Organization Name'}</Label>
                      <Input 
                        id="business_name"
                        value={profile.business_name || ''}
                        onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                        placeholder={isSeller ? 'e.g., Green Valley Farm' : 'e.g., ABC Livestock Trading'}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location_region">Province/Region</Label>
                      <Select 
                        value={profile.location_region || ''}
                        onValueChange={(value) => setProfile({...profile, location_region: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your province" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileOptions.south_african_provinces?.map(province => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location_city">City/Town</Label>
                      <Input 
                        id="location_city"
                        value={profile.location_city || ''}
                        onChange={(e) => setProfile({...profile, location_city: e.target.value})}
                        placeholder="e.g., Stellenbosch"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">About You/Your Business</Label>
                    <Textarea 
                      id="bio"
                      rows={4}
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder={isDualRole ? "Tell other users about your experience with livestock as both buyer and seller..." :
                                  isSeller ? "Tell buyers about your experience, farming practices, and what makes your livestock special..." :
                                  "Tell sellers about your livestock experience, facility, and what you're looking for..."}
                    />
                  </div>
                  
                  <div>
                    <Label>Preferred Communication Methods</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {profileOptions.communication_preferences?.map(method => (
                        <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.preferred_communication?.includes(method) || false}
                            onChange={(e) => updateArrayField('preferred_communication', method, e.target.checked)}
                          />
                          <span className="capitalize">{method.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Expertise Tab */}
                <TabsContent value="expertise" className="space-y-6">
                  <div>
                    <Label>Primary Livestock (What you specialize in)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {profileOptions.livestock_types?.map(type => (
                        <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.primary_livestock?.includes(type) || false}
                            onChange={(e) => updateArrayField('primary_livestock', type, e.target.checked)}
                          />
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Farming Methods</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {profileOptions.farming_methods?.map(method => (
                        <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.farming_methods?.includes(method) || false}
                            onChange={(e) => updateArrayField('farming_methods', method, e.target.checked)}
                          />
                          <span className="capitalize">{method.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Certifications & Credentials</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {profileOptions.certifications?.map(cert => (
                        <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.certifications?.includes(cert) || false}
                            onChange={(e) => updateArrayField('certifications', cert, e.target.checked)}
                          />
                          <span className="capitalize">{cert.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Professional Associations</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {profileOptions.associations?.map(assoc => (
                        <label key={assoc} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.associations?.includes(assoc) || false}
                            onChange={(e) => updateArrayField('associations', assoc, e.target.checked)}
                          />
                          <span>{assoc.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-6">
                  <div>
                    <Label>Farm/Facility Photos</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Show buyers your facilities, livestock environment, and farming setup (max 10 photos)
                    </p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFarmPhotosUpload}
                      className="hidden"
                      id="farm-photos-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('farm-photos-upload').click()}
                      disabled={uploading}
                      className="mb-4"
                    >
                      {uploading ? 'Uploading...' : 'Upload Farm Photos'}
                    </Button>
                    
                    {farmPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {farmPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={photo} 
                              alt={`Farm photo ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Policies Tab */}
                <TabsContent value="policies" className="space-y-6">
                  <div>
                    <Label htmlFor="return_policy">Return Policy</Label>
                    <Textarea 
                      id="return_policy"
                      rows={3}
                      value={profile.return_policy || ''}
                      onChange={(e) => setProfile({...profile, return_policy: e.target.value})}
                      placeholder="e.g., 7-day return policy for livestock with health issues..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="health_guarantee">Health Guarantee</Label>
                    <Textarea 
                      id="health_guarantee"
                      rows={3}
                      value={profile.health_guarantee || ''}
                      onChange={(e) => setProfile({...profile, health_guarantee: e.target.value})}
                      placeholder="e.g., All livestock comes with veterinary health certificates..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery_policy">Delivery Policy</Label>
                    <Textarea 
                      id="delivery_policy"
                      rows={3}
                      value={profile.delivery_policy || ''}
                      onChange={(e) => setProfile({...profile, delivery_policy: e.target.value})}
                      placeholder="e.g., Free delivery within 50km, R5/km beyond..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Textarea 
                      id="payment_terms"
                      rows={3}
                      value={profile.payment_terms || ''}
                      onChange={(e) => setProfile({...profile, payment_terms: e.target.value})}
                      placeholder="e.g., 50% deposit required, balance on delivery..."
                    />
                  </div>
                </TabsContent>

                {/* SELLER-SPECIFIC TABS */}
                {isSeller && (
                  <>
                    {/* Seller Business Information Tab */}
                    <TabsContent value="seller-business" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experience_years">Years of Experience</Label>
                          <Input 
                            id="experience_years"
                            type="number"
                            value={profile.experience_years || ''}
                            onChange={(e) => setProfile({...profile, experience_years: parseInt(e.target.value) || 0})}
                            placeholder="Years in livestock/agriculture"
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_hours">Business Hours</Label>
                          <Input 
                            id="business_hours"
                            value={profile.business_hours || ''}
                            onChange={(e) => setProfile({...profile, business_hours: e.target.value})}
                            placeholder="e.g., Monday-Friday 8AM-5PM"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Delivery Areas</Label>
                        <Textarea 
                          value={profile.delivery_areas?.join(', ') || ''}
                          onChange={(e) => setProfile({...profile, delivery_areas: e.target.value.split(', ').filter(area => area.trim())})}
                          placeholder="e.g., Western Cape, Eastern Cape, Northern Cape"
                          rows={2}
                        />
                      </div>
                    </TabsContent>

                    {/* Seller Expertise Tab */}
                    <TabsContent value="seller-expertise" className="space-y-6">
                      <div>
                        <Label>Primary Livestock (What you specialize in)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                          {profileOptions.livestock_types?.map(type => (
                            <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.primary_livestock?.includes(type) || false}
                                onChange={(e) => updateArrayField('primary_livestock', type, e.target.checked)}
                              />
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Farming Methods</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {profileOptions.farming_methods?.map(method => (
                            <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.farming_methods?.includes(method) || false}
                                onChange={(e) => updateArrayField('farming_methods', method, e.target.checked)}
                              />
                              <span className="capitalize">{method.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Certifications & Credentials</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.certifications?.map(cert => (
                            <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.certifications?.includes(cert) || false}
                                onChange={(e) => updateArrayField('certifications', cert, e.target.checked)}
                              />
                              <span className="capitalize">{cert.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Professional Associations</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.associations?.map(assoc => (
                            <label key={assoc} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.associations?.includes(assoc) || false}
                                onChange={(e) => updateArrayField('associations', assoc, e.target.checked)}
                              />
                              <span>{assoc.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Photos Tab */}
                    <TabsContent value="photos" className="space-y-6">
                      <div>
                        <Label>Farm/Facility Photos</Label>
                        <p className="text-sm text-gray-600 mb-4">
                          Show buyers your facilities, livestock environment, and farming setup (max 10 photos)
                        </p>
                        
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFarmPhotosUpload}
                          className="hidden"
                          id="farm-photos-upload"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('farm-photos-upload').click()}
                          disabled={uploading}
                          className="mb-4"
                        >
                          {uploading ? 'Uploading...' : 'Upload Farm Photos'}
                        </Button>
                        
                        {farmPhotos.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {farmPhotos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img 
                                  src={photo} 
                                  alt={`Farm photo ${index + 1}`} 
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Seller Policies Tab */}
                    <TabsContent value="seller-policies" className="space-y-6">
                      <div>
                        <Label htmlFor="return_policy">Return Policy</Label>
                        <Textarea 
                          id="return_policy"
                          rows={3}
                          value={profile.return_policy || ''}
                          onChange={(e) => setProfile({...profile, return_policy: e.target.value})}
                          placeholder="e.g., 7-day return policy for livestock with health issues..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="health_guarantee">Health Guarantee</Label>
                        <Textarea 
                          id="health_guarantee"
                          rows={3}
                          value={profile.health_guarantee || ''}
                          onChange={(e) => setProfile({...profile, health_guarantee: e.target.value})}
                          placeholder="e.g., All livestock comes with veterinary health certificates..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="delivery_policy">Delivery Policy</Label>
                        <Textarea 
                          id="delivery_policy"
                          rows={3}
                          value={profile.delivery_policy || ''}
                          onChange={(e) => setProfile({...profile, delivery_policy: e.target.value})}
                          placeholder="e.g., Free delivery within 50km, R5/km beyond..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="payment_terms">Payment Terms</Label>
                        <Textarea 
                          id="payment_terms"
                          rows={3}
                          value={profile.payment_terms || ''}
                          onChange={(e) => setProfile({...profile, payment_terms: e.target.value})}
                          placeholder="e.g., 50% deposit required, balance on delivery..."
                        />
                      </div>
                    </TabsContent>
                  </>
                )}

                {/* BUYER-SPECIFIC TABS */}
                {isBuyer && (
                  <>
                    {/* Buyer Preferences Tab */}
                    <TabsContent value="buyer-preferences" className="space-y-6">
                      <div>
                        <Label>Livestock Interests (What you want to buy)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                          {profileOptions.livestock_types?.map(type => (
                            <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.livestock_interests?.includes(type) || false}
                                onChange={(e) => updateArrayField('livestock_interests', type, e.target.checked)}
                              />
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Buying Purpose</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.buying_purposes?.map(purpose => (
                            <label key={purpose} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.buying_purpose?.includes(purpose) || false}
                                onChange={(e) => updateArrayField('buying_purpose', purpose, e.target.checked)}
                              />
                              <span className="capitalize">{purpose.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="purchase_frequency">Purchase Frequency</Label>
                          <Select 
                            value={profile.purchase_frequency || ''}
                            onValueChange={(value) => setProfile({...profile, purchase_frequency: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="How often do you buy?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.purchase_frequencies?.map(freq => (
                                <SelectItem key={freq} value={freq}>{freq.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="budget_range">Budget Range</Label>
                          <Select 
                            value={profile.budget_range || ''}
                            onValueChange={(value) => setProfile({...profile, budget_range: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your budget range" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.budget_ranges?.map(range => (
                                <SelectItem key={range} value={range}>{range.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Buyer Facility Information Tab */}
                    <TabsContent value="buyer-facility" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="facility_type">Facility Type</Label>
                          <Select 
                            value={profile.facility_type || ''}
                            onValueChange={(value) => setProfile({...profile, facility_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select facility type" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.facility_types?.map(type => (
                                <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="farm_size_hectares">Farm Size (Hectares)</Label>
                          <Input 
                            id="farm_size_hectares"
                            type="number"
                            value={profile.farm_size_hectares || ''}
                            onChange={(e) => setProfile({...profile, farm_size_hectares: parseInt(e.target.value) || 0})}
                            placeholder="e.g., 50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="animal_capacity">Animal Capacity</Label>
                          <Input 
                            id="animal_capacity"
                            type="number"
                            value={profile.animal_capacity || ''}
                            onChange={(e) => setProfile({...profile, animal_capacity: parseInt(e.target.value) || 0})}
                            placeholder="Max animals you can house"
                          />
                        </div>
                        <div>
                          <Label htmlFor="veterinary_contact">Veterinary Contact</Label>
                          <Input 
                            id="veterinary_contact"
                            value={profile.veterinary_contact || ''}
                            onChange={(e) => setProfile({...profile, veterinary_contact: e.target.value})}
                            placeholder="Your vet's name and contact"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Farm Infrastructure</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.farm_infrastructure?.map(infra => (
                            <label key={infra} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.farm_infrastructure?.includes(infra) || false}
                                onChange={(e) => updateArrayField('farm_infrastructure', infra, e.target.checked)}
                              />
                              <span className="capitalize">{infra.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="quarantine_facilities"
                          checked={profile.quarantine_facilities || false}
                          onChange={(e) => setProfile({...profile, quarantine_facilities: e.target.checked})}
                        />
                        <Label htmlFor="quarantine_facilities">I have quarantine facilities for new animals</Label>
                      </div>
                    </TabsContent>

                    {/* Buyer Experience Tab */}
                    <TabsContent value="buyer-experience" className="space-y-6">
                      <div>
                        <Label>Livestock Experience</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.livestock_experience?.map(exp => (
                            <label key={exp} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.livestock_experience?.includes(exp) || false}
                                onChange={(e) => updateArrayField('livestock_experience', exp, e.target.checked)}
                              />
                              <span className="capitalize">{exp.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Buyer Certifications</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.buyer_certifications?.map(cert => (
                            <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.buyer_certifications?.includes(cert) || false}
                                onChange={(e) => updateArrayField('buyer_certifications', cert, e.target.checked)}
                              />
                              <span className="capitalize">{cert.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Animal Welfare Standards</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.animal_welfare_standards?.map(standard => (
                            <label key={standard} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.animal_welfare_standards?.includes(standard) || false}
                                onChange={(e) => updateArrayField('animal_welfare_standards', standard, e.target.checked)}
                              />
                              <span className="capitalize">{standard.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="payment_timeline">Preferred Payment Timeline</Label>
                          <Select 
                            value={profile.payment_timeline || ''}
                            onValueChange={(value) => setProfile({...profile, payment_timeline: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="When can you pay?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.payment_timelines?.map(timeline => (
                                <SelectItem key={timeline} value={timeline}>{timeline.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="collection_preference">Collection Preference</Label>
                          <Select 
                            value={profile.collection_preference || ''}
                            onValueChange={(value) => setProfile({...profile, collection_preference: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="How will you collect?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.collection_preferences?.map(pref => (
                                <SelectItem key={pref} value={pref}>{pref.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Preferred Payment Methods</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {profileOptions.payment_methods?.map(method => (
                            <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.payment_methods?.includes(method) || false}
                                onChange={(e) => updateArrayField('payment_methods', method, e.target.checked)}
                              />
                              <span className="capitalize">{method.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="previous_suppliers">Previous Suppliers/References</Label>
                        <Textarea 
                          id="previous_suppliers"
                          rows={3}
                          value={profile.previous_suppliers || ''}
                          onChange={(e) => setProfile({...profile, previous_suppliers: e.target.value})}
                          placeholder="Names and contacts of previous livestock suppliers who can provide references..."
                        />
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => updateProfile(profile)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Updating...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default ProfilePage;