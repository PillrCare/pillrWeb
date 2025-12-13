"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

type EnrollButtonProps = {
  userId: string
}

export default function EnrollButton({ userId }: EnrollButtonProps) {
  const supabase = useMemo(() => createClient(), [])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!modalOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false)
    }

    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [modalOpen])

  const closeModal = () => {
    if (loading) return
    setError(null)
    setModalOpen(false)
  }

  const sendEnroll = async () => {
    if (!userId) {
      setError("No user id provided.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: devices, error: devicesError } = await supabase
        .from("user_device")
        .select("device_id")
        .eq("user_id", userId)
        .not("device_id", "is", null)
        .order("assigned_date", { ascending: false })
        .limit(1)

      if (devicesError) {
        console.error("Error querying user_device for enroll:", devicesError)
        setError("Failed to query devices. See console for details.")
        return
      }

      const deviceId = devices && devices.length > 0 ? devices[0].device_id : null

      if (!deviceId) {
        console.error("No device found for user; cannot send enroll command")
        setError("No registered device found for that user.")
        return
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from("device_commands")
        .update({ enroll: true })
        .eq("device_id", deviceId)
        .select()

      if (updateError) {
        console.error("Failed to update device_commands (enroll):", updateError)
      }

      if (updatedRows && updatedRows.length > 0) {
        setModalOpen(false)
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("device_commands")
          .insert({ device_id: deviceId, enroll: true, emergency_unlock: false, clear: false })
          .select()

        if (insertError) {
          console.error("Failed to insert device_commands row (enroll):", insertError)
          setError("Failed to send enroll command. See console for details.")
        } else {
          setModalOpen(false)
        }
      }
    } catch (err) {
      console.error("Error sending enroll command:", err)
      setError("Unexpected error sending enroll command.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="default" size="lg" className="w-full" onClick={() => setModalOpen(true)}>
        Enroll New Finger
      </Button>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => closeModal()} aria-hidden />

          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-2xl p-0"
          >
            <Card>
              <CardHeader>
                <CardTitle id="modal-title" className="text-red-600 text-2xl">
                  Please Read These Instructions
                </CardTitle>
                <CardDescription className="mt-2">
                  Follow the steps below to enroll a new fingerprint on the device.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <ol className="list-decimal list-inside text-base text-gray-800 space-y-3 leading-relaxed">
                    <li>Press "Send Enroll Command" below.</li>
                    <li>Immediately place the user's finger on the device sensor.</li>
                    <li>When the sensor flashes red, remove the finger briefly, then place it back.</li>
                    <li>Once the sensor turns green, enrollment is complete.</li>
                    <li>Test the fingerprint to confirm it works.</li>
                  </ol>
                </div>

                {error ? (
                  <div className="text-base text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200 font-medium">
                    {error}
                  </div>
                ) : null}
              </CardContent>

              <CardFooter>
                <div className="w-full flex justify-center">
                  <Button onClick={sendEnroll} disabled={loading} size="lg">
                    {loading ? "Sending…" : "Send Enroll Command"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  )
}
