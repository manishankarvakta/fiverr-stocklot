import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Shield, Lock, Eye, Database, FileText, Clock, AlertTriangle } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "January 2, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            How we collect, use, and protect your personal information on StockLot
          </p>
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            Last updated: {lastUpdated}
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-emerald-600" />
                1. Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                StockLot (Pty) Ltd ("we," "our," or "us") is committed to protecting your privacy 
                and ensuring the security of your personal information. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when 
                you use our livestock marketplace platform.
              </p>
              <p>
                This policy complies with the Protection of Personal Information Act (POPIA) 
                of South Africa and other applicable privacy laws.
              </p>
              <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-400">
                <p className="text-emerald-800 mb-0">
                  <strong>Your Privacy Matters:</strong> We believe in transparency about how 
                  we handle your data. If you have questions about this policy, please contact 
                  our Data Protection Officer at privacy@stocklot.farm.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-emerald-600" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>2.1 Personal Information You Provide</h4>
              <p>When you register and use StockLot, we collect:</p>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Profile photo, business name, location, bio</li>
                <li><strong>Identity Verification:</strong> ID documents, business registration, tax numbers</li>
                <li><strong>Financial Information:</strong> Bank account details, payment method information</li>
                <li><strong>Livestock Listings:</strong> Animal descriptions, photos, veterinary certificates</li>
                <li><strong>Communication Data:</strong> Messages, reviews, support interactions</li>
              </ul>

              <h4>2.2 Information Collected Automatically</h4>
              <p>We automatically collect certain information when you use our platform:</p>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Location Data:</strong> General geographic location (for local listings)</li>
                <li><strong>Cookies and Tracking:</strong> Preferences, session data, analytics information</li>
              </ul>

              <h4>2.3 Information from Third Parties</h4>
              <p>We may receive information from:</p>
              <ul>
                <li>Payment processors (transaction verification)</li>
                <li>Identity verification services</li>
                <li>Social media platforms (if you connect your accounts)</li>
                <li>Veterinary service providers (for health certificate verification)</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-emerald-600" />
                3. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>3.1 Primary Uses</h4>
              <p>We use your information to:</p>
              <ul>
                <li><strong>Provide Services:</strong> Enable account creation, livestock trading, payments</li>
                <li><strong>Process Transactions:</strong> Handle purchases, payments, and escrow services</li>
                <li><strong>Verify Identity:</strong> Confirm user identity and prevent fraud</li>
                <li><strong>Facilitate Communication:</strong> Enable messaging between buyers and sellers</li>
                <li><strong>Ensure Safety:</strong> Monitor for fraudulent activity and policy violations</li>
              </ul>

              <h4>3.2 Platform Improvement</h4>
              <p>We analyze usage data to:</p>
              <ul>
                <li>Improve platform functionality and user experience</li>
                <li>Develop new features and services</li>
                <li>Optimize search and recommendation algorithms</li>
                <li>Identify and fix technical issues</li>
              </ul>

              <h4>3.3 Communication and Marketing</h4>
              <p>With your consent, we may use your information to:</p>
              <ul>
                <li>Send platform updates and important announcements</li>
                <li>Provide customer support and assistance</li>
                <li>Share relevant market insights and farming tips</li>
                <li>Promote new features and services (you can opt out anytime)</li>
              </ul>

              <h4>3.4 Legal and Compliance</h4>
              <p>We may use information to:</p>
              <ul>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Respond to legal requests and court orders</li>
                <li>Protect our rights and prevent illegal activities</li>
                <li>Enforce our Terms of Service and platform policies</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-emerald-600" />
                4. Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>4.1 With Other Users</h4>
              <p>Certain information is visible to other platform users:</p>
              <ul>
                <li>Public profile information (name, location, ratings)</li>
                <li>Livestock listings and associated details</li>
                <li>Public reviews and ratings</li>
                <li>Basic contact information (for verified transactions)</li>
              </ul>

              <h4>4.2 Service Providers</h4>
              <p>We share information with trusted third-party service providers:</p>
              <ul>
                <li><strong>Payment Processors:</strong> Paystack, banks (for transaction processing)</li>
                <li><strong>Identity Verification:</strong> Document verification services</li>
                <li><strong>Communication:</strong> Email and SMS service providers</li>
                <li><strong>Analytics:</strong> Platform usage and performance analysis</li>
                <li><strong>Cloud Storage:</strong> Secure data hosting and backup services</li>
              </ul>

              <h4>4.3 Legal Requirements</h4>
              <p>We may disclose information when required by law:</p>
              <ul>
                <li>In response to legal process (subpoenas, court orders)</li>
                <li>To comply with regulatory requirements</li>
                <li>To protect rights, property, or safety of StockLot or others</li>
                <li>In connection with legal investigations</li>
              </ul>

              <h4>4.4 Business Transfers</h4>
              <p>
                In the event of a merger, acquisition, or sale of assets, 
                user information may be transferred to the acquiring entity, 
                subject to the same privacy protections.
              </p>

              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                <p className="text-amber-800 mb-0">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  <strong>We Never Sell Personal Data:</strong> StockLot does not sell, 
                  rent, or trade personal information to third parties for marketing purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-emerald-600" />
                5. Data Security and Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>5.1 Security Measures</h4>
              <p>We implement comprehensive security measures:</p>
              <ul>
                <li><strong>Encryption:</strong> All data transmitted using SSL/TLS encryption</li>
                <li><strong>Secure Storage:</strong> Personal data stored in encrypted databases</li>
                <li><strong>Access Controls:</strong> Limited access on a need-to-know basis</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Incident Response:</strong> Procedures for addressing security breaches</li>
              </ul>

              <h4>5.2 Payment Security</h4>
              <p>Financial information is protected through:</p>
              <ul>
                <li>PCI DSS compliant payment processing</li>
                <li>Tokenization of payment card information</li>
                <li>Two-factor authentication for sensitive operations</li>
                <li>Escrow services for secure transactions</li>
              </ul>

              <h4>5.3 Account Security</h4>
              <p>Users can enhance account security by:</p>
              <ul>
                <li>Using strong, unique passwords</li>
                <li>Enabling two-factor authentication</li>
                <li>Regularly reviewing account activity</li>
                <li>Reporting suspicious activity immediately</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                6. Your Privacy Rights (POPIA)
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>6.1 Access and Control</h4>
              <p>Under POPIA and our commitment to transparency, you have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request copies of personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Objection:</strong> Object to certain uses of your personal information</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
              </ul>

              <h4>6.2 How to Exercise Your Rights</h4>
              <p>To exercise your privacy rights:</p>
              <ol>
                <li>Log into your account and use privacy settings</li>
                <li>Contact our Data Protection Officer at privacy@stocklot.farm</li>
                <li>Submit a written request with proof of identity</li>
                <li>We will respond within 30 days (or as required by law)</li>
              </ol>

              <h4>6.3 Marketing Preferences</h4>
              <p>You can control marketing communications by:</p>
              <ul>
                <li>Updating email preferences in your account settings</li>
                <li>Clicking unsubscribe links in emails</li>
                <li>Contacting customer support</li>
                <li>Opting out of SMS messages by replying "STOP"</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-emerald-600" />
                7. Data Retention and Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>7.1 Retention Periods</h4>
              <p>We retain personal information for different periods:</p>
              <ul>
                <li><strong>Account Information:</strong> While account is active plus 3 years</li>
                <li><strong>Transaction Records:</strong> 7 years (for tax and legal compliance)</li>
                <li><strong>Communication Data:</strong> 2 years after last interaction</li>
                <li><strong>Marketing Data:</strong> Until you opt out or 2 years of inactivity</li>
                <li><strong>Legal Hold Data:</strong> Until legal matters are resolved</li>
              </ul>

              <h4>7.2 Automated Deletion</h4>
              <p>
                We have automated systems that delete or anonymize data when 
                retention periods expire, unless legal requirements mandate longer retention.
              </p>

              <h4>7.3 Account Deletion</h4>
              <p>When you delete your account:</p>
              <ul>
                <li>Personal profile information is removed immediately</li>
                <li>Public content (reviews, listings) may be anonymized</li>
                <li>Transaction records are retained for legal compliance</li>
                <li>Some data may be retained in backups for up to 90 days</li>
              </ul>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-emerald-600" />
                8. International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>8.1 Data Location</h4>
              <p>
                Your personal information is primarily stored and processed in South Africa. 
                However, some of our service providers may be located in other countries 
                with adequate data protection laws.
              </p>

              <h4>8.2 Transfer Safeguards</h4>
              <p>When we transfer data internationally, we ensure:</p>
              <ul>
                <li>Adequate level of protection equivalent to POPIA</li>
                <li>Appropriate contractual safeguards with service providers</li>
                <li>Compliance with cross-border data transfer requirements</li>
                <li>Regular monitoring of international privacy developments</li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-emerald-600" />
                9. Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                StockLot is not intended for children under 18 years old. We do not 
                knowingly collect personal information from children. If we become 
                aware that we have collected information from a child, we will take 
                steps to delete it promptly.
              </p>
              <p>
                Parents or guardians who believe their child has provided personal 
                information should contact us immediately at privacy@stocklot.farm.
              </p>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                10. Privacy Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>10.1 Policy Changes</h4>
              <p>
                We may update this Privacy Policy to reflect changes in our practices, 
                technology, legal requirements, or business operations.
              </p>

              <h4>10.2 Notification of Changes</h4>
              <p>For material changes, we will:</p>
              <ul>
                <li>Send email notifications to registered users</li>
                <li>Display prominent notices on our platform</li>
                <li>Update the "Last Updated" date at the top of this policy</li>
                <li>Provide reasonable time for you to review changes</li>
              </ul>

              <h4>10.3 Continued Use</h4>
              <p>
                Your continued use of StockLot after policy updates constitutes 
                acceptance of the revised Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-emerald-600" />
                11. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>For privacy-related questions, concerns, or requests, please contact:</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Data Protection Officer</strong></p>
                <p>
                  Email: privacy@stocklot.farm
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-400 mt-4">
                <p className="text-emerald-800 mb-0">
                  <strong>Quick Response:</strong> For urgent privacy concerns or suspected 
                  data breaches, please mark your email as "URGENT - PRIVACY" for priority handling.
                </p>
              </div>

              <h4>Information Commissioner's Office</h4>
              <p>
                You also have the right to lodge a complaint with the South African 
                Information Regulator if you believe your privacy rights have been violated:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong>Information Regulator South Africa</strong><br />
                  Website: www.justice.gov.za/inforeg/<br />
                  Email: inforeg@justice.gov.za<br />
                  Phone: +27 12 406 4818
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <div className="text-center py-8 border-t-2 border-gray-200">
            <p className="text-gray-600 italic">
              By using StockLot, you acknowledge that you have read and understood 
              this Privacy Policy and consent to the collection, use, and disclosure 
              of your information as described herein.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Policy Version: 2.1 | Effective Date: {lastUpdated} | POPIA Compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;