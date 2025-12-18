'use client';

import { useState, useEffect } from 'react';
import { BrickleAPI } from '@/lib/api';
import { AdminConfig, UserDocumentDto } from '@/lib/types';

interface DocumentManagementProps {
    adminConfig: AdminConfig;
    onCancel: () => void;
}

export default function DocumentManagement({ adminConfig, onCancel }: DocumentManagementProps) {
    const [documents, setDocuments] = useState<UserDocumentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('PENDING');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const api = new BrickleAPI(adminConfig);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await api.getAllUserDocuments(filter === 'ALL' ? undefined : filter);
            setDocuments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [filter]);

    const handleUpdateStatus = async (id: string, status: string, observation?: string) => {
        try {
            setUpdatingId(id);
            await api.updateUserDocumentStatus(id, { status, observation });
            await fetchDocuments();
        } catch (err: any) {
            alert(`Error updating status: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Review and approve user identification documents</p>
                </div>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-6 flex gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="ALL">All Documents</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No documents found for this filter.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{doc.userName}</div>
                                        <div className="text-sm text-gray-500">{doc.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {doc.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${doc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                                        <a
                                            href={doc.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            View Image
                                        </a>

                                        {doc.status === 'PENDING' && (
                                            <>
                                                <button
                                                    disabled={updatingId === doc.id}
                                                    onClick={() => handleUpdateStatus(doc.id, 'APPROVED')}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={updatingId === doc.id}
                                                    onClick={() => {
                                                        const observation = prompt('Reason for rejection:');
                                                        if (observation !== null) {
                                                            handleUpdateStatus(doc.id, 'REJECTED', observation);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
