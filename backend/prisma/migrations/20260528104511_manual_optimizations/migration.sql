-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "consultationFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Appointment_doctorId_status_idx" ON "Appointment"("doctorId", "status");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Doctor_department_idx" ON "Doctor"("department");

-- CreateIndex
CREATE INDEX "Doctor_specialization_idx" ON "Doctor"("specialization");

-- CreateIndex
CREATE INDEX "QueueToken_doctorId_createdAt_idx" ON "QueueToken"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "QueueToken_status_idx" ON "QueueToken"("status");

-- Custom Optimizations: Partial Unique Index
CREATE UNIQUE INDEX "unique_active_booking" ON "Appointment" ("doctorId", "appointmentDate") WHERE status NOT IN ('CANCELLED');

-- Custom Optimizations: Data Backfill for consultationFee
UPDATE "Appointment" a SET "consultationFee" = d."consultationFee" FROM "Doctor" d WHERE a."doctorId" = d.id;

-- Custom Optimizations: pg_trgm Extension and GIN Indices
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_patient_name_trgm ON "Patient" USING GIN ("name" gin_trgm_ops);
CREATE INDEX idx_patient_phone_trgm ON "Patient" USING GIN ("phoneNumber" gin_trgm_ops);
CREATE INDEX idx_patient_email_trgm ON "Patient" USING GIN ("email" gin_trgm_ops);
CREATE INDEX idx_doctor_name_trgm ON "Doctor" USING GIN ("name" gin_trgm_ops);
