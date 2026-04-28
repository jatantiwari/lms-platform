'use client';

import { useEffect, useState } from 'react';
import { instructorApi } from '@/lib/api';
import { InstructorApplication, InstructorStatus } from '@/types';
import { getInitials, timeAgo } from '@/lib/utils';
import {
  GraduationCap, Loader2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, User,
} from 'lucide-react';
import toast from 'react-hot-toast';

type FilterTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const tabLabels: Record<FilterTab, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const statusConfig: Record<InstructorStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle },
};

export default function AdminInstructorsPage() {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = (status?: string) => {
    setIsLoading(true);
    instructorApi
      .listApplications(status === 'ALL' ? undefined : status)
      .then(({ data }) => setApplications(data.data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const handleApprove = async (id: string) => {
    setReviewing(id);
    try {
      await instructorApi.reviewApplication(id, { status: 'APPROVED' });
      toast.success('Instructor approved');
      load(activeTab);
    } catch {
      toast.error('Failed to approve');
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setReviewing(rejectModal.id);
    try {
      await instructorApi.reviewApplication(rejectModal.id, {
        status: 'REJECTED',
        rejectionReason: rejectReason || undefined,
      });
      toast.success('Instructor rejected');
      setRejectModal(null);
      setRejectReason('');
      load(activeTab);
    } catch {
      toast.error('Failed to reject');
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary-600" />
          Instructor Applications
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve instructor account requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(Object.keys(tabLabels) as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No {activeTab !== 'ALL' ? tabLabels[activeTab].toLowerCase() : ''} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const sc = statusConfig[app.status];
            const StatusIcon = sc.icon;
            const isOpen = expanded === app.id;

            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  {app.user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.user.avatar}
                      alt={app.user.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                      {getInitials(app.user?.name ?? 'U')}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{app.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{app.user?.email}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {sc.label}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {timeAgo(app.createdAt)}
                  </span>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    {/* Expertise */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Areas of Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {app.expertise.map((tag) => (
                          <span key={tag} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Teaching experience */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teaching Experience</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.teachingExperience}</p>
                    </div>

                    {/* Bio */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.bio}</p>
                    </div>

                    {/* Links */}
                    {(app.linkedIn || app.website) && (
                      <div className="flex gap-4">
                        {app.linkedIn && (
                          <a href={app.linkedIn} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                            LinkedIn ↗
                          </a>
                        )}
                        {app.website && (
                          <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                            Website ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* Rejection reason (if rejected) */}
                    {app.status === 'REJECTED' && app.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-600">{app.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {app.status === 'PENDING' && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={reviewing === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          {reviewing === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: app.id, name: app.user?.name ?? '' })}
                          disabled={reviewing === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'REJECTED' && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={reviewing === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          {reviewing === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve Anyway
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <strong>{rejectModal.name}</strong>&apos;s application. An email will be sent to them.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional — will be shown to the applicant)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Insufficient teaching experience, incomplete bio…"
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={reviewing !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
