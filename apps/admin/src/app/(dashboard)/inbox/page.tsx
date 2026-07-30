"use client";

import { Button, Card, Skeleton, useToast } from "@dashboard/ui";
import {
  Mail,
  Search,
  CheckCircle2,
  Archive,
  Trash2,
  Copy,
  Reply,
  Inbox as InboxIcon,
  Circle,
  Phone,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MailCheck,
} from "lucide-react";
import { useState, useMemo } from "react";

import {
  useContactMessages,
  useUpdateContactMessageStatus,
  useDeleteContactMessage,
  ContactMessage,
  ContactStatus,
} from "@/api/contact";

export default function InboxPage() {
  const { addToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, isFetching, refetch } = useContactMessages({
    status: activeFilter,
    search: searchQuery,
    page: currentPage,
    limit: 15,
  });

  const updateStatusMutation = useUpdateContactMessageStatus();
  const deleteMessageMutation = useDeleteContactMessage();

  const messages = data?.items || [];
  const meta = data?.meta;

  // Selected message detail
  const selectedMessage = useMemo(() => {
    if (!messages.length) return null;
    if (selectedMessageId) {
      const found = messages.find((m) => m.id === selectedMessageId);
      if (found) return found;
    }
    return messages[0] || null;
  }, [messages, selectedMessageId]);

  const handleSelectMessage = (msg: ContactMessage) => {
    setSelectedMessageId(msg.id);
    // Automatically mark as READ if currently UNREAD
    if (msg.status === "UNREAD") {
      updateStatusMutation.mutate({ id: msg.id, status: "READ" });
    }
  };

  const handleUpdateStatus = (id: string, status: ContactStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    deleteMessageMutation.mutate(id, {
      onSuccess: () => {
        if (selectedMessageId === id) {
          setSelectedMessageId(null);
        }
      },
    });
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    addToast({
      title: "Email Copied",
      description: `${email} copied to clipboard.`,
      type: "success",
    });
  };

  const filterTabs = [
    { id: "ALL", label: "All Messages" },
    { id: "UNREAD", label: "Unread" },
    { id: "READ", label: "Read" },
    { id: "REPLIED", label: "Replied" },
    { id: "ARCHIVED", label: "Archived" },
  ];

  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case "UNREAD":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">Unread</span>;
      case "READ":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-text-secondary">Read</span>;
      case "REPLIED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Replied</span>;
      case "ARCHIVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">Archived</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <InboxIcon className="h-6 w-6 text-accent" />
            Contact Inbox
          </h1>
          <p className="text-sm text-text-secondary">
            Manage customer inquiries and messages submitted via the storefront Contact Us page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Gmail/Outlook Split Inbox Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row border border-border rounded-2xl bg-surface shadow-sm overflow-hidden">
        {/* Left Filter Column */}
        <div className="w-full md:w-56 shrink-0 border-r border-border p-3 space-y-1 bg-surface/50">
          <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Folders
          </div>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "text-text-secondary hover:bg-muted hover:text-text-primary"
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === "UNREAD" && data?.unreadCount ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white text-accent font-bold" : "bg-accent/20 text-accent font-bold"}`}>
                    {data.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Middle Message List Column */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-border flex flex-col min-h-0 bg-surface">
          {/* Search Header */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, subject..."
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Message List Item Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === "UNREAD";

                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-4 transition-all hover:bg-muted/60 relative ${
                      isSelected
                        ? "bg-accent/10 border-l-4 border-accent"
                        : isUnread
                        ? "bg-surface font-semibold"
                        : "bg-surface/40 text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs truncate ${isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary"}`}>
                        {msg.name}
                      </span>
                      <span className="text-[10px] text-text-secondary shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <div className={`text-xs truncate mb-1 ${isUnread ? "font-medium text-text-primary" : "text-text-secondary"}`}>
                      {msg.subject || "(No Subject)"}
                    </div>

                    <p className="text-[11px] text-text-secondary/75 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {getStatusBadge(msg.status)}
                      {isUnread && <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-text-secondary text-xs">
                <InboxIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No messages found matching current filter.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="p-3 border-t border-border shrink-0 flex items-center justify-between text-xs text-text-secondary bg-surface/50">
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Message Detail Reading Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Detail Toolbar */}
              <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0 bg-surface">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMessage.status)}
                  <span className="text-xs text-text-secondary">
                    Submitted {new Date(selectedMessage.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Action Buttons */}
                  {selectedMessage.status === "UNREAD" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "READ")}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <MailCheck className="h-3.5 w-3.5" />
                      Mark Read
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "UNREAD")}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Mark Unread
                    </Button>
                  )}

                  {selectedMessage.status !== "REPLIED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "REPLIED")}
                      className="text-xs flex items-center gap-1.5 text-emerald-600 border-emerald-500/30"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Replied
                    </Button>
                  )}

                  {selectedMessage.status !== "ARCHIVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "ARCHIVED")}
                      className="text-xs flex items-center gap-1.5 text-amber-600 border-amber-500/30"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="text-xs flex items-center gap-1.5 text-red-600 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header Information */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-text-primary">
                    {selectedMessage.subject || "(No Subject Provided)"}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 text-text-primary">
                      <User className="h-4 w-4 text-accent" />
                      <span className="font-medium">{selectedMessage.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-text-primary">
                      <Mail className="h-4 w-4 text-accent" />
                      <span className="font-mono">{selectedMessage.email}</span>
                      <button
                        onClick={() => handleCopyEmail(selectedMessage.email)}
                        className="p-1 hover:bg-muted rounded text-text-secondary transition-colors"
                        title="Copy Email Address"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {selectedMessage.phone && (
                      <div className="flex items-center gap-2 text-text-primary">
                        <Phone className="h-4 w-4 text-accent" />
                        <span>{selectedMessage.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Message Body Display */}
                <Card className="p-6 border border-border bg-surface">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Message Body
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedMessage.message}
                  </p>
                </Card>

                {/* Reply via Email Action Bar */}
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Reply to Customer</div>
                    <div className="text-xs text-text-secondary">
                      Open your default mail client to reply directly to {selectedMessage.email}
                    </div>
                  </div>

                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject || "Customer Inquiry - Curio Wrap"}`
                    )}`}
                    onClick={() => {
                      if (selectedMessage.status !== "REPLIED") {
                        handleUpdateStatus(selectedMessage.id, "REPLIED");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-medium shadow-sm transition-all shrink-0"
                  >
                    <Reply className="h-4 w-4" />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
              <Mail className="h-12 w-12 opacity-30 mb-3" />
              <div className="text-sm font-medium text-text-primary mb-1">No Message Selected</div>
              <div className="text-xs max-w-xs">
                Select a message from the list on the left to read its content and take actions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
