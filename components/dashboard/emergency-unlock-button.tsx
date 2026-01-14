"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmergencyUnlockButtonProps {
    patientId: string;
}

export default function EmergencyUnlockButton({ patientId }: EmergencyUnlockButtonProps) {
    const supabase = createClient();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openModal = () => {
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        if (loading) return;
        setShowModal(false);
        setError(null);
    };

    const handleEmergencyUnlock = async () => {
        setLoading(true);
        setError(null);
        try {

            // Trigger emergency unlock
            const { error: unlockError } = await supabase
                .from('device_commands')
                .update({ 
                    emergency_unlock: true,
                })
                .eq('user_id', patientId);

            if (unlockError) {
                console.error('Failed to trigger emergency unlock:', unlockError);
                setError(unlockError.message ?? 'Failed to trigger emergency unlock');
                return;
            }

            setShowModal(false);
        } catch (e) {
            console.error('Error triggering emergency unlock:', e);
            setError('Error triggering emergency unlock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className="p-2 rounded border bg-destructive hover:bg-primary text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={openModal}
                disabled={loading}
            >
                Emergency Open
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => closeModal()} aria-hidden />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 border border-gray-200"
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={loading}
                            aria-label="Close dialog"
                            className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6"
                                aria-hidden
                            >
                                <path d="M6 6l12 12" />
                                <path d="M6 18L18 6" />
                            </svg>
                        </button>

                        <h3 id="modal-title" className="text-3xl font-bold text-red-600 mb-6">
                            Confirm Emergency Unlock
                        </h3>

                        <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-xl text-gray-800 leading-relaxed">
                                Are you sure you want to emergency open the device? This will unlock it to the next scheduled dose.
                            </p>
                        </div>

                        {error ? (
                            <div className="text-lg text-red-600 mb-6 p-4 bg-red-50 rounded border border-red-200 font-medium">
                                {error}
                            </div>
                        ) : null}

                        <div className="flex justify-center gap-4 pt-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="px-8 py-4 text-2xl font-bold rounded-lg shadow-md bg-gray-200 hover:bg-gray-300 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleEmergencyUnlock}
                                disabled={loading}
                                className="px-8 py-4 text-2xl font-bold rounded-lg shadow-md bg-destructive hover:bg-red-700 text-white disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                            >
                                {loading ? "Unlocking..." : "Emergency Open"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
