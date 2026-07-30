import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1";

async function main() {
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: "admin.updated@curiowrap.com",
    password: "Password123!",
  });
  const token = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.accessToken;
  console.log("Logged in with updated email:", loginRes.data?.data?.user?.email);

  const changeRes = await axios.post(
    `${API_BASE}/users/change-email`,
    { newEmail: "admin@curiowrap.com", currentPassword: "Password123!" },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("Reverted email back to:", changeRes.data?.data?.user?.email);
}

main().catch(console.error);
