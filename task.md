
# Deployment Plan for Doribharat (FRESH START)

> **Current Focus**: Using `deploy_fresh.sh` to bypass Terraform issues and fix permissions automatically.

- [x] **Fresh Start Init**
    - [x] Create `deploy_fresh.sh` (Pure gcloud, no Terraform) <!-- id: 100 -->
    - [x] Create `README_FRESH.md` <!-- id: 101 -->


- [x] Project Discovery <!-- id: 0 -->
    - [x] Read mentioned README files to understand architecture <!-- id: 1 -->
    - [x] Explore codebase for frontend, backend, and infrastructure details <!-- id: 2 -->
    - [x] Identify database schema and initial data requirements <!-- id: 3 -->
    - [x] Identify storage requirements (image hosting) <!-- id: 4 -->
- [x] Planning <!-- id: 5 -->
    - [x] Create detailed implementation plan for GCP deployment <!-- id: 6 -->
    - [x] Review plan with user <!-- id: 7 -->
- [x] Infrastructure Setup <!-- id: 8 -->
    - [x] Check for local tools (gcloud, terraform) <!-- id: 23 -->
    - [x] Create `setup_infra.sh` for Cloud Shell execution (fallback if local tools missing) <!-- id: 24 -->
    - [x] Provision Cloud SQL and Networking (Attempts via Script Failed - Switched to Manual UI) <!-- id: 25 -->
    - [x] Configure Storage Buckets (Script handles this via defaults or manual step if needed) <!-- id: 10 -->
- [/] Backend Deployment <!-- id: 12 -->
    - [/] Build and submit container to GCR/Artifact Registry (In Progress) <!-- id: 13 -->
    - [/] Deploy to Cloud Run (In Progress) <!-- id: 14 -->
    - [/] Run database migrations (Prisma) (In Progress/Checking) <!-- id: 15 -->
- [/] Manual Deployment (UI Fallback) <!-- id: 28 -->
    - [/] Create Cloud SQL Instance & User manually <!-- id: 29 -->
    - [ ] Create Secrets (`db-password`, `admin-users-secret`) manually <!-- id: 30 -->
    - [ ] Deploy from Source to Cloud Run manually <!-- id: 31 -->
- [x] Frontend Deployment <!-- id: 16 -->
    - [x] Build frontend (Vite) (Included in Dockerfile) <!-- id: 17 -->
    - [x] Deploy to Firebase Hosting or GCS (Unified with Backend in Cloud Run) <!-- id: 18 -->
- [/] Verification <!-- id: 19 -->
    - [ ] Verify admin panel login <!-- id: 20 -->
    - [ ] Verify frontend-backend integration <!-- id: 21 -->
    - [ ] Verify image upload/retrieval <!-- id: 22 -->
- [ ] Domain Configuration <!-- id: 26 -->
    - [ ] Guide user on Cloud Run Domain Mapping <!-- id: 27 -->
