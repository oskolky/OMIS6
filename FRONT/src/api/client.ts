const API_URL = "";

export async function fetchDocuments() {
  const res = await fetch(`/documents`);
  return res.json();
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`/extract`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function deleteDocument(id: number) {
  const res = await fetch(`/documents/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function reprocessDocument(id: number) {
  const res = await fetch(`/reprocess/${id}`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`/stats`);
  return res.json();
}

