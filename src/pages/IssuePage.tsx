// src/pages/IssuePage.tsx
import React, { useState } from "react";

interface IssueCertificateResponse {
  success: boolean;
  certificateId?: string;
  transactionId?: string;
  topicId?: string;
  ipfsCid?: string;
  cidHash?: string;
  verificationUrl?: string;
  ipfsUrl?: string;
  hashscanUrl?: string;
  message?: string;
  error?: string;
}

const IssuePage: React.FC = () => {
  const [form, setForm] = useState({
    recipientName: "",
    recipientEmail: "",
    issuerName: "",
    issuerOrganization: "",
    courseName: "",
    completionDate: "",
    certificateFile: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IssueCertificateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let base64File = "";
      let fileName = "";
      let fileType = "";

      if (form.certificateFile) {
        fileName = form.certificateFile.name;
        fileType = form.certificateFile.type;
        const buffer = await form.certificateFile.arrayBuffer();
        base64File = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      }

      const body = {
        recipientName: form.recipientName,
        recipientEmail: form.recipientEmail,
        issuerName: form.issuerName,
        issuerOrganization: form.issuerOrganization,
        courseName: form.courseName,
        completionDate: form.completionDate,
        certificateFile: base64File,
        fileName,
        fileType,
      };

      const res = await fetch("/functions/issue-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supabase_token")}`,
        },
        body: JSON.stringify(body),
      });

      const data: IssueCertificateResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Certificate issuance failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Issue Certificate</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white shadow rounded-lg p-6"
      >
        <input
          name="recipientName"
          placeholder="Recipient Name"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          type="email"
          name="recipientEmail"
          placeholder="Recipient Email"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="issuerName"
          placeholder="Issuer Name"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="issuerOrganization"
          placeholder="Issuer Organization"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="courseName"
          placeholder="Course Name"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          type="date"
          name="completionDate"
          onChange={handleChange}
          className="input"
          required
        />
        <input
          type="file"
          name="certificateFile"
          accept="application/pdf,image/*"
          onChange={handleChange}
          className="input"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Issuing..." : "Issue Certificate"}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Certificate Issued 🎉</h2>
          <p>{result.message}</p>

          <div className="mt-4 space-y-2">
            {result.ipfsUrl && (
              <a
                href={result.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                View Certificate on IPFS
              </a>
            )}
            {result.hashscanUrl && (
              <a
                href={result.hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                View Proof on HashScan
              </a>
            )}
            {result.verificationUrl && (
              <a
                href={result.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Verify Certificate
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuePage;
