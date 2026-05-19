import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  MessageSquare, PlusCircle, Send, ArrowLeft, Clock, 
  CheckCircle2, AlertCircle, Filter, LifeBuoy, User, 
  Mail, Phone, ShieldAlert, HelpCircle 
} from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin && location.pathname === '/support') {
      navigate('/admin/support', { replace: true });
    } else if (!isAdmin && location.pathname.startsWith('/admin')) {
      navigate('/support', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate]);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    category: 'Admission',
    priority: 'Medium',
    subject: '',
    description: ''
  });

  // Admin Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
      // Poll ticket replies every 6 seconds to keep it live
      const interval = setInterval(() => {
        pollTicketDetails(selectedTicket._id);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/api/tickets' : '/api/tickets/my';
      const res = await axios.get(endpoint);
      setTickets(res.data);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const pollTicketDetails = async (ticketId) => {
    try {
      const res = await axios.get(`/api/tickets/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.warn('Failed to poll ticket updates');
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/tickets/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (err) {
      toast.error('Failed to load ticket conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/tickets', newTicket);
      toast.success('Support ticket raised successfully!');
      setModalOpen(false);
      setNewTicket({
        category: 'Admission',
        priority: 'Medium',
        subject: '',
        description: ''
      });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplyLoading(true);
    try {
      const res = await axios.post(`/api/tickets/${selectedTicket._id}/reply`, { message: replyText });
      setSelectedTicket(res.data.ticket);
      setReplyText('');
      // Refetch parent tickets listing quietly to update status tags in the bg
      const endpoint = isAdmin ? '/api/tickets' : '/api/tickets/my';
      const listRes = await axios.get(endpoint);
      setTickets(listRes.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await axios.put(`/api/tickets/${selectedTicket._id}/status`, { status });
      setSelectedTicket(res.data.ticket);
      toast.success(`Ticket marked as ${status}`);
      // Refetch listings
      const endpoint = isAdmin ? '/api/tickets' : '/api/tickets/my';
      const listRes = await axios.get(endpoint);
      setTickets(listRes.data);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1 w-max"><Clock size={12} /> Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1 w-max"><Clock size={12} /> In Progress</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 w-max"><CheckCircle2 size={12} /> Resolved</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-rose-50 text-rose-600 border border-rose-100">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-blue-50 text-blue-600 border border-blue-100">Medium</span>;
      case 'Low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-gray-50 text-gray-600 border border-gray-100">Low</span>;
      default:
        return null;
    }
  };

  // Filtered Tickets for Admin
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    
    const studentName = t.student?.name || '';
    const studentEmail = t.student?.email || '';
    const studentMobile = t.student?.mobile || '';
    const subject = t.subject || '';
    const ticketId = t.ticketId || '';
    
    const matchesSearch = searchQuery === '' || 
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentMobile.includes(searchQuery) ||
      subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="min-h-screen py-10 px-4 md:px-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Support Header */}
        {!selectedTicket && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LifeBuoy size={28} className="text-indigo-600 animate-spin-slow" />
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Clash Display' }}>
                  {isAdmin ? 'Admin Help Desk' : 'Help & Support'}
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isAdmin 
                  ? 'Monitor student questions, handle queries, and resolve pre-registration issues.'
                  : 'Raise a ticket or chat with SNS Institutions support regarding your application.'}
              </p>
            </div>
            {!isAdmin && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200"
                style={{ background: 'var(--primary)' }}
              >
                <PlusCircle size={18} />
                <span>Raise a Ticket</span>
              </button>
            )}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* 1. TICKET DETAILS / CHAT SCREEN */}
          {selectedTicket ? (
            <div className="rounded-3xl shadow-sm border overflow-hidden flex flex-col md:flex-row" 
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)', minHeight: '600px' }}>
              
              {/* Left Bar: Sidebar Details */}
              <div className="w-full md:w-80 p-6 border-b md:border-b-0 md:border-r flex flex-col justify-between" 
                style={{ borderColor: 'var(--card-border)', background: 'rgba(249, 250, 251, 0.3)' }}>
                <div>
                  <button
                    onClick={() => { setSelectedTicket(null); fetchTickets(); }}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors mb-6"
                  >
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-0.5">Ticket ID</span>
                      <span className="text-base font-extrabold font-mono text-gray-800">{selectedTicket.ticketId}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-0.5">Category</span>
                      <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{selectedTicket.category}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-0.5">Priority</span>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-0.5">Status</span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>

                    {/* Student Info (For Admin View) */}
                    {isAdmin && selectedTicket.student && (
                      <div className="pt-4 border-t mt-4" style={{ borderColor: 'var(--card-border)' }}>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <User size={13} /> Student Details
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold text-gray-800">{selectedTicket.student.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Mail size={12} />
                            <span>{selectedTicket.student.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Phone size={12} />
                            <span>{selectedTicket.student.mobile}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Status Toggles */}
                {isAdmin && (
                  <div className="pt-6 border-t mt-6" style={{ borderColor: 'var(--card-border)' }}>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 block mb-3">Update Status</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus('open')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${selectedTicket.status === 'open' ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white hover:bg-gray-50 text-indigo-600 border-indigo-100'}`}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('in_progress')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${selectedTicket.status === 'in_progress' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white hover:bg-gray-50 text-amber-600 border-amber-100'}`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('resolved')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${selectedTicket.status === 'resolved' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white hover:bg-gray-50 text-emerald-600 border-emerald-100'}`}
                      >
                        Solved
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Bar: Chat Area */}
              <div className="flex-1 flex flex-col h-[600px]">
                
                {/* Chat Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-800" style={{ fontFamily: 'Clash Display' }}>{selectedTicket.subject}</h3>
                    <p className="text-xs text-gray-400">Created on {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                  
                  {/* Original Query Bubble */}
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      S
                    </div>
                    <div className="bg-white border rounded-2xl p-4 shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
                      <p className="text-xs font-extrabold text-indigo-600 mb-1 flex items-center gap-1">
                        <span>{selectedTicket.student?.name || 'Student'}</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-normal">Original Query</span>
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Replies List */}
                  {selectedTicket.replies?.map((reply, idx) => {
                    const isMyReply = isAdmin ? reply.sender === 'support' : reply.sender === 'student';
                    
                    return (
                      <div key={idx} className={`flex gap-3 max-w-[85%] ${isMyReply ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMyReply ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {isMyReply ? (isAdmin ? 'A' : 'S') : (isAdmin ? 'S' : 'A')}
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm ${isMyReply ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`} 
                          style={isMyReply ? {} : { borderColor: 'var(--card-border)' }}>
                          <p className={`text-[10px] font-bold mb-1 ${isMyReply ? 'text-indigo-200' : 'text-indigo-600'}`}>
                            {reply.sender === 'support' ? 'SNS Support Helper' : (selectedTicket.student?.name || 'Student')}
                          </p>
                          <p className={isMyReply ? 'text-white' : 'text-gray-700'}>{reply.message}</p>
                          <span className={`block text-[9px] text-right mt-1.5 ${isMyReply ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(reply.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={chatEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t flex gap-2 bg-white" style={{ borderColor: 'var(--card-border)' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message reply here..."
                    disabled={replyLoading}
                    className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: 'var(--card-border)' }}
                  />
                  <button
                    type="submit"
                    disabled={replyLoading || !replyText.trim()}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                  >
                    {replyLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                    <span>Send</span>
                  </button>
                </form>

              </div>
            </div>
          ) : (
            
            // 2. TICKETS DIRECTORY / LIST VIEW
            <div>
              
              {/* Admin filters */}
              {isAdmin && (
                <div className="rounded-2xl p-5 mb-6 border bg-white shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between" 
                  style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <Filter size={14} /> Filter Status:
                    </div>
                    <div className="flex bg-gray-100 p-0.5 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'open', label: 'Open' },
                        { key: 'in_progress', label: 'Active' },
                        { key: 'resolved', label: 'Solved' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setStatusFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search subject, user name, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                      style={{ borderColor: 'var(--card-border)' }}
                    />
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl p-12 text-center border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <HelpCircle size={30} />
                  </div>
                  <h3 className="font-extrabold text-lg text-gray-800" style={{ fontFamily: 'Clash Display' }}>No support tickets found</h3>
                  <p className="text-sm mt-1 mb-6" style={{ color: 'var(--text-muted)' }}>
                    {isAdmin ? 'No open questions matching the active criteria.' : 'If you have any questions or payment issues, raise a ticket.'}
                  </p>
                  {!isAdmin && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 transition-all hover:scale-105"
                    >
                      Create First Ticket
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map(ticket => (
                    <div
                      key={ticket._id}
                      onClick={() => fetchTicketDetails(ticket._id)}
                      className="rounded-2xl p-5 border hover:border-indigo-300 transition-all cursor-pointer shadow-sm hover:shadow bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-bold font-mono text-gray-400">{ticket.ticketId}</span>
                          <span className="text-xs font-bold text-gray-500 px-2 py-0.5 rounded bg-slate-100">{ticket.category}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>

                        <h3 className="text-base font-extrabold text-gray-800 hover:text-indigo-600 transition-colors" style={{ fontFamily: 'Clash Display' }}>
                          {ticket.subject}
                        </h3>

                        {/* Student meta (for admin display) */}
                        {isAdmin && ticket.student && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <User size={12} /> {ticket.student.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail size={12} /> {ticket.student.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {ticket.student.mobile}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0" style={{ borderColor: '#f1f5f9' }}>
                        {getStatusBadge(ticket.status)}
                        <ChevronRight className="text-gray-400 hidden md:block" size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* CREATE TICKET MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-fade-up border" style={{ borderColor: 'var(--card-border)' }}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Clash Display' }}>Raise Support Ticket</h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <option value="Admission">Admission Inquiry</option>
                    <option value="Payment">Payment Dispute</option>
                    <option value="Document Verification">Documents Query</option>
                    <option value="General Inquiry">General Help</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Double payment deduction on Razorpay"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ borderColor: 'var(--card-border)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Please write down details, payment IDs, error messages or files you are facing problem with..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  style={{ borderColor: 'var(--card-border)' }}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all border"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 transition-all hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Raise Ticket</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Inline responsive Chevron
function ChevronRight(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={props.className} style={{ width: props.size, height: props.size }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
