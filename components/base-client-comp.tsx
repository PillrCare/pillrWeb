// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { createClient } from "@/lib/supabase/client"; // browser client

// type Row = any; // replace with a proper type

// export default function MyClientComponent() {
//   const supabase = useMemo(() => createClient(), []);
//   const [rows, setRows] = useState<Row[] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;
//     async function load() {
//       setLoading(true);
//       try {
//         const { data, error } = await supabase.from("your_table").select("*");
//         if (error) throw error;
//         if (mounted) setRows(data ?? []);
//       } catch (err: any) {
//         console.error(err);
//         if (mounted) setError(err.message ?? String(err));
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }
//     load();
//     return () => {
//       mounted = false;
//     };
//   }, [supabase]);

//   if (loading) return <div>Loading…</div>;
//   if (error) return <div className="text-destructive">{error}</div>;

//   return (
//     <div>
//       {/* render your rows */}
//       <pre>{JSON.stringify(rows, null, 2)}</pre>
//     </div>
//   );
// }