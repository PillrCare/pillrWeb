import React from "react";

type Patient = {
  id?: string;
  username?: string;
  name?: string;
  device_id?: string;
  device_status?: string;
};

type EditForm = {
  name?: string;
};

type Props = {
  patient: Patient | null;
  isEditing: boolean;
  editForm: EditForm;
  setEditForm: (v: EditForm) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function PatientInfo({ patient, isEditing, editForm, setEditForm, onEdit, onCancel, onSave }: Props) {
  return (
    <div className="p-3 bg-accent rounded border">
      <h4 className="font-semibold mb-2">Patient Information</h4>
      <div className="space-y-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Name</div>
        {isEditing ? (
            <input value={editForm.name ?? patient?.name ?? patient?.username ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2 py-1 border rounded" />
          ) : (
            <div className="text-foreground">{patient?.name ?? patient?.username}</div>
          )}
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Device</div>
          <div className="text-sm text-foreground">{patient?.device_id ?? "—"} — <span className={`${patient?.device_status === 'connected' ? 'text-green-600' : patient?.device_status === 'low-battery' ? 'text-orange-600' : 'text-red-600'}`}>{patient?.device_status ?? 'unknown'}</span></div>
        </div>

        <div className="mt-2 flex gap-2">
          {!isEditing ? (
            <button className="p-2 bg-background rounded rounded border" onClick={onEdit}>Edit</button>
          ) : (
            <>
              <button className="p-2 bg-destructive rounded border" onClick={onCancel}>Cancel</button>
              <button className="p-2 bg-background rounded border" onClick={onSave}>Save</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
