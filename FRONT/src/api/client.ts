const API_URL = "http://localhost:8000";

export async function fetchDocuments() {
  const res = await fetch(`${API_URL}/documents`);
  return res.json();
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/extract`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function deleteDocument(id: number) {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function reprocessDocument(id: number) {
  const res = await fetch(`${API_URL}/reprocess/${id}`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  return res.json();
}
