import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeAlert, CheckCircle, Clock, Mail, MessageSquare, RefreshCw, Zap, TrendingUp, BarChart2, PieChart, Star, Search, Filter, LogOut, Shield, MapPin, Image, Archive, FileText, Download } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const AdminDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [analytics, setAnalytics] = useState({ categoryData: [], priorityData: [] });
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [admin, setAdmin] = useState(null);

    // Enterprise: Mock Officers for Assignment
    const mockOfficers = [
        { id: 'off001', name: 'Inspector Vikram', role: 'Senior', experience: 15 },
        { id: 'off002', name: 'Officer Priya', role: 'Senior', experience: 8 },
        { id: 'off003', name: 'Officer Rajesh', role: 'Junior', experience: 2 },
        { id: 'off004', name: 'Officer Suresh', role: 'Junior', experience: 3 }
    ];
    const [assignee, setAssignee] = useState('');

    const canReassign = (ticket) => {
        if (!ticket.assignedTo) return true;
        // Find assignment time
        const assignedEvent = ticket.statusHistory?.find(h => h.status === 'Assigned' || h.note?.includes('Assigned'));
        if (!assignedEvent) return true; // Fallback

        const assignedTime = new Date(assignedEvent.time);
        const now = new Date();
        const diffHours = (now - assignedTime) / 36e5;

        // Logic: Locked until timeout based on priority
        let timeoutHours = 24;
        if (ticket.priority === 'Critical') timeoutHours = 4;
        if (ticket.priority === 'High') timeoutHours = 12;

        return diffHours > timeoutHours;
    };

    const getRecommendedOfficers = (priority) => {
        if (priority === 'Critical' || priority === 'High') {
            return mockOfficers.filter(o => o.role === 'Senior');
        }
        return mockOfficers; // All for lower priorities, or maybe sort Juniors first
    };

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    // Edit Response State
    const [responseMode, setResponseMode] = useState('view');
    const [editableResponse, setEditableResponse] = useState('');

    // Learning Modal State
    const [showLearningModal, setShowLearningModal] = useState(false);
    const [correction, setCorrection] = useState({ keyword: '', category: 'Others', priority: 'Low' });
    const [isEditingCategory, setIsEditingCategory] = useState(false);

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [cRes, aRes] = await Promise.all([
                axios.get('http://localhost:5000/api/complaints'),
                axios.get('http://localhost:5000/api/analytics')
            ]);
            setComplaints(cRes.data);
            setAnalytics(aRes.data);
        } catch (e) {
            console.error("Fetch error", e);
        }
    };

    useEffect(() => {
        const storedAdmin = localStorage.getItem('admin');
        if (!storedAdmin) navigate('/admin-login');
        setAdmin(JSON.parse(storedAdmin));

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selected) {
            // Default to regional if available, else English
            setEditableResponse(selected.suggestedResponse);
            setResponseMode('view');
            setAssignee('');
        }
    }, [selected]);

    const resolveComplaint = async (id) => {
        await axios.post(`http://localhost:5000/api/complaint/${id}/resolve`, {
            responseText: editableResponse
        });
        fetchData();
        if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'Resolved' }));
        setResponseMode('view');
        setResponseMode('view');
    };

    const handleAssign = async (ticketId) => {
        if (!assignee) return alert("Please select an officer");
        try {
            await axios.post('http://localhost:5000/api/admin/assign', { ticketId, officerId: assignee });
            alert("Ticket Assigned Successfully");
            fetchData();
            setSelected(prev => ({
                ...prev,
                status: 'In Progress',
                assignedTo: assignee,
                statusHistory: [...(prev.statusHistory || []), { status: 'Assigned', time: new Date().toISOString(), note: 'Assigned' }]
            }));
        } catch (e) { alert("Assignment Failed"); }
    };

    const handleTrainAI = async () => {
        await axios.post('http://localhost:5000/api/feedback', {
            keyword: correction.keyword,
            correctCategory: correction.category,
            correctPriority: correction.priority
        });
        setShowLearningModal(false);
        alert("SmartPost AI has updated its classification model based on your feedback.");
    };

    const handleLogout = () => {
        localStorage.removeItem('admin');
        navigate('/admin-login');
    };

    const getSLAStatus = (deadline) => {
        if (!deadline) return { text: 'N/A', color: 'text-gray-400' };
        const hoursLeft = (new Date(deadline) - new Date()) / 36e5;
        if (hoursLeft < 0) return { text: 'OVERDUE', color: 'text-red-600 font-bold' };
        if (hoursLeft < 2) return { text: `${hoursLeft.toFixed(1)}h Left (Urgent)`, color: 'text-orange-600 font-bold' };
        return { text: `${hoursLeft.toFixed(1)}h Left`, color: 'text-green-600' };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Submitted': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const filteredComplaints = complaints.filter(c => {
        const matchSearch = (c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toString().includes(searchTerm));

        // Tab-based Filtering
        let matchStatus = true;
        if (activeTab === 'tickets') {
            // Active Complaints Tab: Hide Resolved
            matchStatus = c.status !== 'Resolved';
        } else if (activeTab === 'history') {
            // History Tab: Show ONLY Resolved
            matchStatus = c.status === 'Resolved';
        } else {
            // Fallback
            matchStatus = statusFilter === 'All' || c.status === statusFilter;
        }

        const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    const feedbackRatingData = [
        { name: '5 Star', value: complaints.filter(c => c.rating === 5).length },
        { name: '4 Star', value: complaints.filter(c => c.rating === 4).length },
        { name: '3 Star', value: complaints.filter(c => c.rating === 3).length },
        { name: '2 Star', value: complaints.filter(c => c.rating === 2).length },
        { name: '1 Star', value: complaints.filter(c => c.rating === 1).length },
    ];

    const generateReport = async () => {
        const doc = new jsPDF();
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const reportData = complaints;

        // --- CALCULATION LOGIC ---
        const total = reportData.length;
        const resolvedCount = reportData.filter(c => c.status === 'Resolved').length;
        const pendingCount = total - resolvedCount;

        // 1. Efficiency Metrics
        let totalResolutionHours = 0;
        let resolvedWithHistoryCount = 0;
        reportData.filter(c => c.status === 'Resolved').forEach(c => {
            const submitTime = new Date(c.timestamp);
            // Find resolution time from history or fallback to current (approx) if missing
            const resolveEntry = c.statusHistory?.find(h => h.status === 'Resolved');
            if (resolveEntry) {
                const resolveTime = new Date(resolveEntry.time);
                totalResolutionHours += (resolveTime - submitTime) / 36e5; // ms to hours
                resolvedWithHistoryCount++;
            }
        });
        const avgResTime = resolvedWithHistoryCount > 0 ? (totalResolutionHours / resolvedWithHistoryCount).toFixed(1) : "N/A";

        const slaBreaches = reportData.filter(c => c.status !== 'Resolved' && new Date(c.slaDeadline) < new Date()).length;

        // 2. Root Cause Analysis (Category Breakdown)
        const categoryCounts = {};
        reportData.forEach(c => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1; });
        const categoryRows = Object.entries(categoryCounts)
            .map(([cat, count]) => [cat, count, `${((count / total) * 100).toFixed(1)}%`])
            .sort((a, b) => b[1] - a[1]); // Sort by volume

        // 3. Sentiment & Priority Stats
        const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
        reportData.forEach(c => {
            const sent = c.sentiment || 'Neutral';
            if (sentimentCounts[sent] !== undefined) sentimentCounts[sent]++;
            else if (sent.includes('Negative')) sentimentCounts.Negative++;
            else sentimentCounts.Neutral++;
        });

        // --- PDF GENERATION ---

        // Header
        doc.setFontSize(22);
        doc.setTextColor(185, 28, 28); // Red-700
        doc.text("SmartPost AI - Intelligence Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Officer: ${admin.name}`, 14, 33);
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, 38, 196, 38);

        let finalY = 45;

        // SECTION 1: OPERATIONAL EFFICIENCY (Actionable KPIs)
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("1. Operational Efficiency & KPI", 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Key Performance Indicator', 'Value', 'Assessment']],
            body: [
                ['Total Grievance Volume', total, ''],
                ['Resolution Rate', `${((resolvedCount / total) * 100).toFixed(1)}%`, resolvedCount / total < 0.5 ? 'Needs Improvement' : 'Healthy'],
                ['Avg. Resolution Time', `${avgResTime} Hours`, avgResTime > 48 ? 'Critical Lag' : 'Optimal'],
                ['SLA Breaches', slaBreaches, slaBreaches > 0 ? 'IMMEDIATE ACTION REQUIRED' : 'None'],
                ['Active Backlog', pendingCount, pendingCount > 10 ? 'High Load' : 'Manageable']
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 80 },
                2: { fontStyle: 'bold', textColor: [200, 0, 0] }
            }
        });
        finalY = doc.lastAutoTable.finalY + 15;

        // SECTION 2: ROOT CAUSE ANALYSIS (Category Heatmap)
        doc.text("2. Root Cause Analysis (Top Issues)", 14, finalY);
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Complaint Category', 'Volume', 'Share of Total']],
            body: categoryRows,
            theme: 'striped',
            headStyles: { fillColor: [230, 126, 34] } // Orange
        });
        finalY = doc.lastAutoTable.finalY + 15;

        // --- NEW SECTION: VISUAL ANALYTICS ---
        doc.addPage();
        finalY = 20;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("3. Visual Analytics Snapshot", 14, finalY);

        try {
            const catChart = document.getElementById('category-chart');
            const priChart = document.getElementById('priority-chart');

            if (catChart && priChart) {
                // Capture Charts
                const catCanvas = await html2canvas(catChart, { scale: 2 });
                const priCanvas = await html2canvas(priChart, { scale: 2 });

                const catImg = catCanvas.toDataURL('image/png');
                const priImg = priCanvas.toDataURL('image/png');

                // Embed Images (Side by Side)
                doc.addImage(catImg, 'PNG', 15, finalY + 10, 80, 60);
                doc.addImage(priImg, 'PNG', 105, finalY + 10, 80, 60);

                finalY = finalY + 80;
            }
        } catch (e) {
            console.error("Chart capture failed", e);
            doc.setFontSize(10);
            doc.setTextColor(200, 0, 0);
            doc.text("[Visual charts could not be rendered in this report generation]", 14, finalY + 20);
            finalY += 30;
        }

        // --- NEW SECTION: STRATEGIC RECOMMENDATIONS ---
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("4. AI Insights & Strategic Recommendations", 14, finalY);

        doc.setFontSize(11);
        doc.setTextColor(50);
        const insights = [];

        // Logic for auto-generating insights
        if (slaBreaches > 0) insights.push(`• CRITICAL: ${slaBreaches} tickets have breached SLA. Immediate reallocation of staff to 'High Priority' queue is recommended.`);
        if (resolvedCount / total < 0.6) insights.push(`• Resolution Rate is low (${((resolvedCount / total) * 100).toFixed(0)}%). Consider temporarily pausing new non-critical intakes or enabling overtime.`);
        const topCategory = categoryRows[0]?.[0];
        if (topCategory) insights.push(`• Top Issue: '${topCategory}' accounts for the majority of complaints. Investigate upstream root causes (e.g., specific courier partner or sorting hub).`);
        if (sentimentCounts.Negative > sentimentCounts.Neutral) insights.push(`• Negative Sentiment Alert: High frustration detected. Ensure first responses are empathetic rather than automated boilerplate.`);

        if (insights.length === 0) insights.push("• Operations are running smoothly. No critical anomalies detected.");

        let textY = finalY + 10;
        insights.forEach(insight => {
            const splitText = doc.splitTextToSize(insight, 180);
            doc.text(splitText, 14, textY);
            textY += (splitText.length * 6) + 4;
        });

        finalY = textY + 10;

        // SECTION 5: CRITICAL CASE ATTENTION LIST
        doc.text("5. Critical Attention Required (Top 10)", 14, finalY);

        // Filter: Critical/High priority AND Not Resolved
        const criticalCases = reportData
            .filter(c => c.status !== 'Resolved' && (c.priority === 'Critical' || c.priority === 'High'))
            .sort((a, b) => new Date(a.slaDeadline) - new Date(b.slaDeadline)) // Sort by deadline (soonest first)
            .slice(0, 10)
            .map(c => {
                const hoursLeft = ((new Date(c.slaDeadline) - new Date()) / 36e5).toFixed(1);
                return [
                    c.id,
                    c.category,
                    c.priority.toUpperCase(),
                    `${hoursLeft} hrs`,
                    c.sentiment || 'Neutral'
                ];
            });

        if (criticalCases.length > 0) {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['Ticket ID', 'Category', 'Priority', 'SLA Time Left', 'Sentiment']],
                body: criticalCases,
                theme: 'grid',
                headStyles: { fillColor: [192, 57, 43] }, // Red
                columnStyles: {
                    2: { fontStyle: 'bold', textColor: [200, 0, 0] },
                    3: { fontStyle: 'bold' }
                }
            });
        } else {
            doc.setFontSize(11);
            doc.setTextColor(46, 204, 113); // Green
            doc.text("✓ No critical unresolved cases pending.", 14, finalY + 10);
        }

        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : finalY + 20;

        // --- NEW SECTION: CSAT & TRENDS ---
        doc.addPage();
        finalY = 20;

        // CALCULATION FOR NEW SECTIONS
        const ratedComplaints = reportData.filter(c => c.rating > 0);
        const avgRating = ratedComplaints.length ? (ratedComplaints.reduce((a, b) => a + b.rating, 0) / ratedComplaints.length).toFixed(1) : "No Ratings";
        const promoterCount = ratedComplaints.filter(c => c.rating >= 4).length;
        const detractorCount = ratedComplaints.filter(c => c.rating <= 2).length;

        // Time Analysis
        const hourCounts = {};
        reportData.forEach(c => {
            const h = new Date(c.timestamp).getHours();
            hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const peakHour = Object.keys(hourCounts).length ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b) : "N/A";
        const peakTimeStr = peakHour !== "N/A" ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : "N/A";

        // SECTION 6: CITIZEN SATISFACTION
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("6. Citizen Satisfaction (CSAT) & Quality", 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Metric', 'Value', 'Context']],
            body: [
                ['Average User Rating', `${avgRating} / 5.0`, avgRating >= 4 ? 'Excellent Performance' : avgRating < 3 ? 'Critical Dissatisfaction' : 'Average'],
                ['Feedback Volume', `${ratedComplaints.length} Ratings`, `Response Rate: ${((ratedComplaints.length / total) * 100).toFixed(0)}%`],
                ['Detractors (1-2 Stars)', detractorCount, detractorCount > 0 ? 'Requires Follow-up' : 'None'],
                ['Promoters (4-5 Stars)', promoterCount, 'Brand Advocates']
            ],
            theme: 'grid',
            headStyles: { fillColor: [241, 196, 15], textColor: [0, 0, 0] } // Yellow-ish
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // SECTION 7: OPERATIONAL TRENDS
        doc.text("7. Operational Trends (Resource Planning)", 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Insight Dimension', 'Observation', 'Recommendation']],
            body: [
                ['Peak Submission Time', peakTimeStr, 'Ensure max staff availability during this window.'],
                ['Top Complaint Source', categoryRows[0]?.[0] || "N/A", 'Focus preventive measures here.'],
                ['Avg Sentiment Score', sentimentCounts.Negative > sentimentCounts.Positive ? 'Negative Skew' : 'Positive/Neutral', sentimentCounts.Negative > sentimentCounts.Positive ? 'Deploy Conflict Resolution Training' : 'Maintain Standard Protocol']
            ],
            theme: 'striped',
            headStyles: { fillColor: [142, 68, 173] } // Purple
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // SECTION 8: RECENT FEEDBACK SNIPPETS (Qualitative)
        if (ratedComplaints.length > 0) {
            doc.text("8. Voice of the Citizen (Recent Feedback)", 14, finalY);
            const recentFeedback = ratedComplaints.slice(0, 3).map(c => [`"${c.userFeedback || 'No comment'}"`, `${c.rating} Stars`, c.category]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['User Comment', 'Rating', 'Relevant Category']],
                body: recentFeedback,
                theme: 'plain',
                columnStyles: {
                    0: { fontStyle: 'italic', textColor: [80, 80, 80] },
                    1: { halign: 'center', fontStyle: 'bold' }
                }
            });
        }

        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : finalY + 20;

        // --- NEW SECTIONS: GEO & FINANCIAL ---
        doc.addPage();
        finalY = 20;

        // CALCULATION FOR GEO & FINANCE
        const cityCounts = {};
        reportData.forEach(c => {
            // Extract city assuming format "City, State" or just use full string
            const city = c.location ? c.location.split(',')[0].trim() : 'Unknown Location';
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        });
        const hotspotRows = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([city, count]) => [city, count, count > 5 ? 'High Intensity' : 'Moderate']);

        // Financial Risk Logic (Dummy assumptions for hackathon)
        const riskMap = { 'Damaged Item': 2000, 'Lost Package': 5000, 'Delay in Delivery': 500, 'Wrong Delivery': 1000, 'Others': 0 };
        let totalRisk = 0;
        const categoryRisk = {};
        reportData.forEach(c => {
            const cost = riskMap[c.category] || 0;
            if (c.status !== 'Resolved') {
                totalRisk += cost;
                categoryRisk[c.category] = (categoryRisk[c.category] || 0) + cost;
            }
        });
        const riskRows = Object.entries(categoryRisk)
            .filter(([_, cost]) => cost > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, cost]) => [cat, `INR ${cost.toLocaleString()}`, 'Estimated Liability']);


        // SECTION 9: GEOGRAPHIC HOTSPOTS
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("9. Geographic Hotspot Analysis (Problem Zones)", 14, finalY);

        if (hotspotRows.length > 0) {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['City / Hub Location', 'Complaint Volume', 'Severity Status']],
                body: hotspotRows,
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80] } // Dark Blue/Grey
            });
        } else {
            doc.setFontSize(11);
            doc.text("No location data available for hotspots.", 14, finalY + 10);
        }

        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : finalY + 20;

        // SECTION 10: FINANCIAL RISK ASSESSMENT
        doc.text("10. Financial Liability & Risk Assessment", 14, finalY);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Estimated Risk Exposure: INR ${totalRisk.toLocaleString()}`, 14, finalY + 7);

        if (riskRows.length > 0) {
            autoTable(doc, {
                startY: finalY + 12,
                head: [['Risk Category', 'Est. Financial Impact', 'Type']],
                body: riskRows,
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43] }, // Red
                columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
            });
        } else {
            doc.text("No active financial risks detected.", 14, finalY + 15);
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Confidential - Internal Use Only - SmartPost AI Analytics', 14, 290);
            doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
        }

        doc.save(`SmartPost_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    if (!admin) return null;

    return (
        <div className="min-h-screen font-sans text-slate-800 pb-20 relative bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
            {/* Dynamic Gradient Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white pt-6 px-6 pb-28 shadow-2xl relative overflow-hidden sticky top-0 z-20">
                {/* Animated Wave Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,50 C150,80 350,0 600,50 C850,100 1050,30 1200,50 L1200,120 L0,120 Z" fill="white" className="animate-pulse" />
                    </svg>
                </div>

                {/* Floating Envelope Icon */}
                <div className="absolute top-4 right-20 opacity-10 animate-bounce">
                    <Mail className="h-32 w-32" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border-2 border-white/30 shadow-xl">
                                <Mail className="h-10 w-10 text-yellow-300" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                                    India Post
                                    <span className="text-yellow-300 text-2xl">•</span>
                                    <span className="text-yellow-300 font-bold">डाक विभाग</span>
                                </h1>
                                <p className="text-yellow-200 text-sm font-semibold tracking-wide mt-1">
                                    Officer Admin Console
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-white/10 backdrop-blur-md p-3 rounded-xl hover:bg-white/25 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-white/10">
                        {[
                            { id: 'dashboard', label: 'Analytics', icon: BarChart2 },
                            { id: 'tickets', label: 'Complaints', icon: MessageSquare },
                            { id: 'history', label: 'History', icon: Archive },
                            { id: 'feedback', label: 'Feedback', icon: Star }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelected(null); }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-red-700 shadow-lg transform scale-105' : 'text-red-100 hover:bg-white/10'}`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-6 -mt-16 relative z-20">

                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-center bg-gradient-to-r from-white to-yellow-50 p-8 rounded-3xl shadow-2xl border-2 border-yellow-200/50 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-30"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold text-gray-800 mb-1">Monthly Overview</h2>
                                <p className="text-gray-600 font-medium">Analytics for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={generateReport} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
                                <Download className="h-4 w-4" /> Generate Monthly Report
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-lg hover:border-red-300 transition-all duration-300 relative overflow-hidden">
                                <div className="text-gray-500 text-sm font-medium mb-1">Total Complaints</div>
                                <div className="text-3xl font-bold">{analytics.total || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-lg hover:border-red-300 transition-all duration-300 relative overflow-hidden">
                                <div className="text-gray-500 text-sm font-medium mb-1">Pending</div>
                                <div className="text-3xl font-bold text-orange-600">{(analytics.total - analytics.resolved) || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-lg hover:border-red-300 transition-all duration-300 relative overflow-hidden">
                                <div className="text-gray-500 text-sm font-medium mb-1">Resolved</div>
                                <div className="text-3xl font-bold text-green-600">{analytics.resolved || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-lg hover:border-red-300 transition-all duration-300 relative overflow-hidden">
                                <div className="text-gray-500 text-sm font-medium mb-1">AI Precision</div>
                                <div className="text-3xl font-bold text-blue-600">88%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 h-96">
                            <div id="category-chart" className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-gray-100 flex flex-col">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8 flex items-center gap-2">
                                    <PieChart className="h-5 w-5" /> Complaints by Category
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie data={analytics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {analytics.categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div id="priority-chart" className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-gray-100 flex flex-col">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8 flex items-center gap-2">
                                    <BarChart2 className="h-5 w-5" /> Priority Distribution
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.priorityData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#EAB308" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'tickets' || activeTab === 'history') && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-white to-yellow-50 p-8 rounded-3xl shadow-2xl border-2 border-yellow-200/50 flex justify-between items-center backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-30"></div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-1 relative z-10">{activeTab === 'tickets' ? 'Active Complaints' : 'Resolved History'}</h2>
                            <div className="flex gap-4 relative z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        placeholder="Search tickets..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-64 border-2 border-gray-200 p-2.5 pl-9 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 hover:border-gray-300"
                                    />
                                </div>
                                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border-2 border-gray-200 p-2.5 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 hover:border-gray-300">
                                    <option value="All">All Priorities</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-6 h-[calc(100vh-8rem)]">
                            <div className="w-1/3 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-6 flex flex-col overflow-hidden">
                                <div className="p-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    {filteredComplaints.length} Tickets Found
                                </div>
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {filteredComplaints.length === 0 ? (
                                        <div className="text-center py-32 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-yellow-50/50"></div>
                                            <Archive className="h-24 w-24 text-yellow-300 mx-auto mb-6 relative z-10 animate-pulse" />
                                            <h3 className="text-gray-600 font-bold text-xl relative z-10">No {activeTab === 'tickets' ? 'active' : 'resolved'} complaints</h3>
                                        </div>
                                    ) : (
                                        filteredComplaints.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelected(c)}
                                                className={`p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden ${selected?.id === c.id ? 'bg-gradient-to-r from-red-50 to-yellow-50 border-2 border-red-300 shadow-md' : 'bg-white border-2 border-gray-100 hover:border-red-300'}`}
                                            >
                                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-yellow-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex gap-2 items-center">
                                                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full border-2 ${getStatusColor(c.status)}`}>
                                                            {c.status}
                                                        </span>
                                                        <span className="text-xs font-mono font-bold text-red-600">#{c.id}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">{c.category}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{c.text}</p>
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className={`font-bold ${c.priority === 'Critical' ? 'text-red-600' : c.priority === 'High' ? 'text-orange-600' : 'text-gray-500'}`}>{c.priority} Priority</span>
                                                    <span className={getSLAStatus(c.slaDeadline).color}>{getSLAStatus(c.slaDeadline).text}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-6 overflow-y-auto">
                                {selected ? (
                                    <>
                                        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-100">
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    {isEditingCategory ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="text-xl font-bold border-2 border-red-200 rounded-lg p-1"
                                                                defaultValue={selected.category}
                                                                id="ai-category-select"
                                                            >
                                                                {stats.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                                            </select>
                                                            <button
                                                                onClick={async () => {
                                                                    const newCat = document.getElementById('ai-category-select').value;
                                                                    try {
                                                                        // Train AI
                                                                        await axios.post('http://localhost:5000/api/train-ai', {
                                                                            text: selected.text,
                                                                            category: newCat,
                                                                            priority: selected.priority
                                                                        });
                                                                        alert(`AI Trained! Future complaints like this will be '${newCat}'`);
                                                                        setIsEditingCategory(false);
                                                                    } catch (e) { alert("Training failed"); }
                                                                }}
                                                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg hover:scroll-p-1"
                                                            >
                                                                Save & Train AI
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group">
                                                            <h2 className="text-3xl font-black text-gray-900">{selected.category}</h2>
                                                            <button
                                                                onClick={() => setIsEditingCategory(true)}
                                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs border border-gray-200 p-1 rounded"
                                                                title="Correct Category & Train AI"
                                                            >
                                                                ✎ Train AI
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(selected.status)}`}>
                                                        {selected.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-mono font-bold">Reference: #{selected.id}</p>
                                            </div>
                                            <div className="text-right text-sm text-gray-600 flex flex-col items-end gap-2">
                                                <p>Filed by: {selected.user}</p>
                                                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selected.location || 'N/A'}</p>

                                                {/* Action Buttons */}
                                                {activeTab !== 'history' && selected.status !== 'Resolved' && (
                                                    <button
                                                        onClick={async () => {
                                                            const btn = document.getElementById('notify-btn');
                                                            if (btn) {
                                                                btn.innerText = 'Updating...';
                                                                btn.disabled = true;
                                                            }
                                                            await axios.post('http://localhost:5000/api/notify-user', { id: selected.id, user: selected.user, category: selected.category, priority: selected.priority });
                                                            if (btn) {
                                                                btn.innerText = '✓ Marked In Progress';
                                                                btn.className = "bg-yellow-50 text-yellow-700 text-xs px-3 py-1.5 rounded border border-yellow-200 font-bold flex items-center gap-1 cursor-default";
                                                            }
                                                        }}
                                                        id="notify-btn"
                                                        className="bg-white text-gray-600 text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 font-medium flex items-center gap-1 transition shadow-sm mt-2"
                                                    >
                                                        <Clock className="h-3 w-3" /> Mark Under Progress & Notify
                                                    </button>

                                                )}

                                                {/* Assignment Panel */}
                                                {selected.status !== 'Resolved' && (
                                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                                            {selected.assignedTo ? (canReassign(selected) ? 'Re-assign Case (SLA Breached)' : 'Case Assigned (Locked)') : 'Assign Case'}
                                                        </p>

                                                        {!selected.assignedTo || canReassign(selected) ? (
                                                            <div className="flex gap-2">
                                                                <select
                                                                    className="text-xs border rounded p-1 w-40"
                                                                    value={assignee}
                                                                    onChange={(e) => setAssignee(e.target.value)}
                                                                >
                                                                    <option value="">Select Officer</option>
                                                                    {getRecommendedOfficers(selected.priority).map(o => (
                                                                        <option key={o.id} value={o.id}>
                                                                            {o.name} ({o.role})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => handleAssign(selected.id)}
                                                                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold hover:bg-blue-700"
                                                                >
                                                                    {selected.assignedTo ? 'Re-assign' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span className="font-bold text-blue-600">Assigned to {mockOfficers.find(o => o.id === selected.assignedTo)?.name || 'Officer'}</span>
                                                                <span className="text-gray-400">• Awaiting response</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {selected.explanation && (
                                            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-900 p-5 rounded-2xl flex items-start gap-4 border-2 border-indigo-200 relative z-10">
                                                <Zap className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1">Why did AI choose this?</h4>
                                                    <p className="opacity-90">{selected.explanation}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {/* EVIDENCE IMAGE */}
                                            {selected.image && (
                                                <div className="mb-4">
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <Image className="h-4 w-4" /> Photo Evidence
                                                    </h3>
                                                    <div className="relative group w-fit">
                                                        <img
                                                            src={selected.image}
                                                            alt="Evidence"
                                                            className="h-56 w-auto rounded-2xl border-4 border-gray-200 shadow-xl cursor-zoom-in hover:shadow-2xl transition-all"
                                                            onClick={() => window.open(selected.image, '_blank')}
                                                        />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition rounded-2xl pointer-events-none"></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" /> Complaint Description
                                                </h3>
                                                <div className="bg-gradient-to-br from-gray-50 to-yellow-50/30 p-6 rounded-2xl border-2 border-gray-200 text-gray-700 leading-relaxed shadow-sm mb-6">
                                                    "{selected.text}"
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <Zap className="h-4 w-4 text-purple-600" /> SmartPilot Suggested Response
                                                    </h3>
                                                    {selected.status !== 'Resolved' && responseMode === 'view' && (
                                                        <button onClick={() => setResponseMode('edit')} className="text-xs text-purple-600 hover:underline">Edit Response</button>
                                                    )}
                                                </div>

                                                {/* LANGUAGE TOGGLE */}
                                                {selected.responseOptions && selected.responseOptions.regional && responseMode === 'edit' && (
                                                    <div className="mb-3 flex gap-2 animate-fade-in">
                                                        <button
                                                            onClick={() => setEditableResponse(selected.responseOptions.en)}
                                                            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition"
                                                        >
                                                            <span className="font-bold bg-gray-200 w-4 h-4 flex items-center justify-center rounded text-[10px]">EN</span> English
                                                        </button>
                                                        <button
                                                            onClick={() => setEditableResponse(selected.responseOptions.regional)}
                                                            className="px-3 py-1.5 text-xs border border-purple-200 bg-purple-50 text-purple-800 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-100 transition ring-1 ring-purple-200"
                                                        >
                                                            <span className="font-bold bg-purple-200 w-4 h-4 flex items-center justify-center rounded text-[10px]">{selected.responseOptions.detectedLang.toUpperCase()}</span> {selected.responseOptions.detectedLang === 'hi' ? 'Hindi' : 'Telugu'} (Recommended)
                                                        </button>
                                                    </div>
                                                )}

                                                <div className={`rounded-2xl border transition-all ${responseMode === 'edit' ? 'border-purple-300 ring-2 ring-purple-100 bg-white' : 'border-purple-200 bg-purple-50'}`}>
                                                    {responseMode === 'edit' ? (
                                                        <textarea
                                                            value={editableResponse}
                                                            onChange={(e) => setEditableResponse(e.target.value)}
                                                            className="w-full p-4 rounded-2xl focus:outline-none text-sm min-h-[100px]"
                                                        />
                                                    ) : (
                                                        <div className="p-4 text-sm text-purple-900 leading-relaxed whitespace-pre-wrap">
                                                            {selected.status === 'Resolved' && selected.finalResponse ? selected.finalResponse : selected.suggestedResponse}
                                                        </div>
                                                    )}

                                                    {selected.status !== 'Resolved' && (
                                                        <div className="px-4 py-3 bg-purple-100/50 border-t border-purple-200 flex justify-end gap-3 rounded-b-2xl">
                                                            {responseMode === 'edit' && <button onClick={() => setResponseMode('view')} className="text-xs text-gray-600 px-3 py-1.5 hover:bg-white rounded">Cancel</button>}
                                                            <button
                                                                onClick={() => resolveComplaint(selected.id)}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                                                            >
                                                                <Mail className="h-3 w-3" /> {responseMode === 'edit' ? 'Save & Send' : 'Approve & Send'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                        <Filter className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Select a ticket to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    activeTab === 'feedback' && (
                        <div className="flex gap-6 h-[calc(100vh-8rem)]">
                            <div className="w-1/3 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8 flex flex-col">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8 flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Customer Satisfaction
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackRatingData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" fill="#EAB308" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="flex-1 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8 overflow-hidden flex flex-col">
                                <h3 className="font-bold text-gray-800 mb-4">Feedback Comments</h3>
                                <div className="overflow-y-auto space-y-4">
                                    {complaints.filter(c => c.rating).length === 0 && <p className="text-gray-400">No feedback submitted yet.</p>}
                                    {complaints.filter(c => c.rating).map(c => (
                                        <div key={c.id} className="border-b last:border-0 pb-4">
                                            <div className="flex justify-between">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} className={`h-4 w-4 ${c.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2 italic">"{c.userFeedback || 'No comment provided'}"</p>
                                            <div className="text-xs text-gray-400 mt-1">Ticket #{c.id} • {c.category}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >

            {/* Learning Modal */}
            {
                showLearningModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md">
                        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center transform scale-105 animate-fade-in">
                            <h3 className="text-3xl font-black text-gray-800 mb-3">Retrain AI Model</h3>
                            <p className="text-gray-600 mb-8">Found a misclassification? Provide correct label to update Neural Pattern Matcher.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <RefreshCw className="h-5 w-5 text-blue-600" />
                                        Trigger Keyword
                                    </label>
                                    <input className="w-full border-2 border-gray-200 p-5 rounded-2xl h-44 focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 leading-relaxed hover:border-gray-300" style={{ height: '60px' }} placeholder="e.g., 'refund'" value={correction.keyword} onChange={e => setCorrection({ ...correction, keyword: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        Correct Category
                                    </label>
                                    <select className="w-full border-2 border-gray-200 p-5 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 hover:border-gray-300" value={correction.category} onChange={e => setCorrection({ ...correction, category: e.target.value })}>
                                        <option>Lost Package</option>
                                        <option>Damaged Item</option>
                                        <option>Delay in Delivery</option>
                                        <option>Wrong Delivery</option>
                                        <option>Staff Behavior</option>
                                        <option>Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        Correct Priority
                                    </label>
                                    <select className="w-full border-2 border-gray-200 p-5 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none transition-all shadow-sm text-gray-700 hover:border-gray-300" value={correction.priority} onChange={e => setCorrection({ ...correction, priority: e.target.value })}>
                                        <option>Critical</option>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 justify-end pt-6">
                                    <button onClick={() => setShowLearningModal(false)} className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                    <button onClick={handleTrainAI} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">Update Model</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;