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