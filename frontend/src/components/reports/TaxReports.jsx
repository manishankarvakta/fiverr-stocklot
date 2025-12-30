import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  FileText, Download, Calendar, DollarSign, 
  Calculator, TrendingUp, AlertCircle, CheckCircle,
  PieChart, BarChart3, Clock, Filter
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import Footer from '../ui/common/Footer';
import Header from '../ui/common/Header';
import { useGetTaxReportsQuery, useGenerateTaxReportMutation, useLazyDownloadTaxReportQuery } from '../../store/api/reports.api';

const TaxReports = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('annual');

  // RTK Query hooks
  const { data: reports = [], isLoading: loading, refetch } = useGetTaxReportsQuery({ year: selectedYear });
  console.log('Fetched reports:', reports);
  const [generateTaxReport] = useGenerateTaxReportMutation();
  const [downloadTaxReport] = useLazyDownloadTaxReportQuery();



  const generateReport = async (type, period) => {
    setGenerating(true);
    try {
      await generateTaxReport({
        type,
        year: selectedYear,
        ...period
      }).unwrap();
      
      // Refetch reports after generation
      refetch();
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const blob = await downloadTaxReport(reportId).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'generating': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access tax reports.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tax reports...</p>
      </div>
    );
  }

  const currentYearReports = reports.filter(r => r.year === selectedYear);
  const totalIncome = currentYearReports.reduce((sum, r) => sum + (r.summary?.total_income || r.summary?.income || 0), 0);
  const totalExpenses = currentYearReports.reduce((sum, r) => sum + (r.summary?.total_expenses || r.summary?.expenses || 0), 0);

  return (
    <>
    {/* <Header /> */}
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Tax Reports</h1>
          <p className="text-emerald-700">Generate and download tax-ready financial reports</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-emerald-300 rounded-lg text-emerald-700"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Total Income</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Total Expenses</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Net Profit</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(totalIncome - totalExpenses)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Reports Generated</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {currentYearReports.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button
              onClick={() => generateReport('annual', {})}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Annual Report
            </Button>
            
            <Button
              onClick={() => generateReport('quarterly', { quarter: Math.ceil(new Date().getMonth() / 3) })}
              disabled={generating}
              variant="outline"
              className="border-emerald-300 text-emerald-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Quarterly Report
            </Button>
            
            <Button
              onClick={() => generateReport('monthly', { month: new Date().getMonth() + 1 })}
              disabled={generating}
              variant="outline"
              className="border-emerald-300 text-emerald-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Monthly Report
            </Button>
            
            <Button
              onClick={() => generateReport('vat', { quarter: Math.ceil(new Date().getMonth() / 3) })}
              disabled={generating}
              variant="outline"
              className="border-emerald-300 text-emerald-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              VAT Return
            </Button>
          </div>
          
          {generating && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4 animate-spin" />
                Generating report... This may take a few minutes.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Reports */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">Generated Reports ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {currentYearReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-600">No reports generated for {selectedYear} yet.</p>
              <p className="text-sm text-emerald-500 mt-2">Use the buttons above to generate your first report.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentYearReports.map((report) => (
                <div key={report.id} className="border border-emerald-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-emerald-900">{report.title}</h3>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-emerald-600 space-y-1">
                        <p>Generated: {new Date(report.generated_at).toLocaleDateString()}</p>
                        {report.summary && (
                          <div className="flex gap-4 mt-2">
                            {report.summary.total_income && (
                              <span>Income: {formatCurrency(report.summary.total_income)}</span>
                            )}
                            {report.summary.total_expenses && (
                              <span>Expenses: {formatCurrency(report.summary.total_expenses)}</span>
                            )}
                            {report.summary.net_profit && (
                              <span>Profit: {formatCurrency(report.summary.net_profit)}</span>
                            )}
                            {report.summary.net_vat_due && (
                              <span>VAT Due: {formatCurrency(report.summary.net_vat_due)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.status === 'ready' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id)}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-emerald-800">
            <div>
              <h4 className="font-semibold mb-2">Agricultural Tax Benefits:</h4>
              <ul className="space-y-1 text-emerald-700">
                <li>• Primary agricultural income may qualify for reduced tax rates</li>
                <li>• Livestock sales may be eligible for capital gains treatment</li>
                <li>• Feed, veterinary, and farming expenses are deductible</li>
                <li>• Depreciation allowances available for farm equipment</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Important Reminders:</h4>
              <ul className="space-y-1 text-emerald-700">
                <li>• Keep detailed records of all livestock transactions</li>
                <li>• Maintain receipts for all farm-related expenses</li>
                <li>• Consider quarterly VAT returns if applicable</li>
                <li>• Consult a tax professional for complex situations</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Disclaimer:</strong> These reports are for informational purposes only. 
              Please consult with a qualified tax professional or accountant for official tax preparation and filing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* <Footer /> */}
    </>
  );
};

export default TaxReports;