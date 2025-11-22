import React from 'react'
import { GenerateQRModal } from '@/components/GenerateQRModal'
import { AddTenantModal } from '@/components/AddTenantModal'
import { EditTenantModal } from '@/components/EditTenantModal'
import { DeleteTenantModal } from '@/components/DeleteTenantModal'
import { AddUserModal } from '@/components/AddUserModal'
import { EditUserModal } from '@/components/EditUserModal'
import { DeleteUserModal } from '@/components/DeleteUserModal'
import { ResetPasswordModal } from '@/components/ResetPasswordModal'
import {
  ViewQRModal,
  DeleteQRModal,
  BulkDeleteQRModal,
  BulkDeleteUsersModal,
  ImpersonateTenantModal
} from '@/components/modals'
import type { Tenant, PlatformUser } from '@/services/superAdminService'
import type { QRCodeData } from '@/components/QRCard'

/**
 * Props for GenerateQR modal group
 */
interface GenerateQRModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Props for Tenant modal group
 */
interface TenantModalProps {
  // Add Tenant Modal
  isAddTenantModalOpen: boolean
  setIsAddTenantModalOpen: (open: boolean) => void
  // Edit Tenant Modal
  isEditTenantModalOpen: boolean
  setIsEditTenantModalOpen: (open: boolean) => void
  // Delete Tenant Modal
  isDeleteTenantModalOpen: boolean
  setIsDeleteTenantModalOpen: (open: boolean) => void
  // Selected tenant
  selectedTenant: Tenant | null
  setSelectedTenant: (tenant: Tenant | null) => void
  // Success handler
  onTenantSuccess: () => void
}

/**
 * Props for User modal group
 */
interface UserModalProps {
  // Add User Modal
  isAddUserModalOpen: boolean
  setIsAddUserModalOpen: (open: boolean) => void
  // Edit User Modal
  isEditUserModalOpen: boolean
  setIsEditUserModalOpen: (open: boolean) => void
  // Delete User Modal
  isDeleteUserModalOpen: boolean
  setIsDeleteUserModalOpen: (open: boolean) => void
  // Reset Password Modal
  isResetPasswordModalOpen: boolean
  setIsResetPasswordModalOpen: (open: boolean) => void
  // Bulk Delete Users Modal
  showUsersBulkDeleteConfirm: boolean
  setShowUsersBulkDeleteConfirm: (show: boolean) => void
  selectedUserIds: Set<number>
  isUsersBulkDeleting: boolean
  usersBulkDeleteError: string | null
  setUsersBulkDeleteError: (error: string | null) => void
  handleBulkDeleteUsers: () => void
  // Selected user
  selectedUser: PlatformUser | null
  setSelectedUser: (user: PlatformUser | null) => void
  // Success handler
  onUserSuccess: () => void
}

/**
 * Props for QR modal group
 */
interface QRModalProps {
  // View QR Modal
  isViewQRModalOpen: boolean
  setIsViewQRModalOpen: (open: boolean) => void
  // Delete QR Modal
  isDeleteQRModalOpen: boolean
  setIsDeleteQRModalOpen: (open: boolean) => void
  // Bulk Delete QR Modal
  showBulkDeleteConfirm: boolean
  setShowBulkDeleteConfirm: (show: boolean) => void
  // Selected QR
  selectedQR: QRCodeData | null
  setSelectedQR: (qr: QRCodeData | null) => void
  // Delete state
  isDeleting: boolean
  deleteError: string | null
  setDeleteError: (error: string | null) => void
  confirmDeleteQR: () => void
  // Bulk delete state
  filteredQRCodes: QRCodeData[]
  qrStatusFilter: string
  qrBatchFilter: string
  qrSearchQuery: string
  qrAssignmentFilter: string
  qrTenantFilter: string
  isBulkDeleting: boolean
  bulkDeleteProgress: number
  bulkDeleteError: string | null
  setBulkDeleteError: (error: string | null) => void
  handleBulkDelete: () => void
}

/**
 * Props for Impersonation modal group
 */
interface ImpersonationModalProps {
  isImpersonateModalOpen: boolean
  impersonateTenant: Tenant | null
  tenantAdmins: PlatformUser[]
  isLoadingAdmins: boolean
  isImpersonating: boolean
  impersonateError: string | null
  closeImpersonationModal: () => void
  confirmImpersonation: (userId: number) => void
}

/**
 * Combined props for SuperAdminModals component
 */
export interface SuperAdminModalsProps {
  // Generate QR Modal
  generateQR: GenerateQRModalProps
  // Tenant Modals
  tenant: TenantModalProps
  // User Modals
  user: UserModalProps
  // QR Modals
  qr: QRModalProps
  // Impersonation Modal
  impersonation: ImpersonationModalProps
}

/**
 * SuperAdminModals Component
 *
 * Consolidates all modal rendering for the Super Admin Dashboard.
 * This component renders all modals in one place to reduce the main
 * dashboard component size.
 */
export const SuperAdminModals: React.FC<SuperAdminModalsProps> = ({
  generateQR,
  tenant,
  user,
  qr,
  impersonation
}) => {
  return (
    <>
      {/* Generate QR Modal */}
      <GenerateQRModal
        isOpen={generateQR.isOpen}
        onClose={generateQR.onClose}
        onSuccess={generateQR.onSuccess}
      />

      {/* Tenant Modals */}
      <AddTenantModal
        isOpen={tenant.isAddTenantModalOpen}
        onClose={() => tenant.setIsAddTenantModalOpen(false)}
        onSuccess={tenant.onTenantSuccess}
      />

      <EditTenantModal
        isOpen={tenant.isEditTenantModalOpen}
        tenant={tenant.selectedTenant}
        onClose={() => {
          tenant.setIsEditTenantModalOpen(false)
          tenant.setSelectedTenant(null)
        }}
        onSuccess={tenant.onTenantSuccess}
        onDelete={() => {
          tenant.setIsEditTenantModalOpen(false)
          tenant.setSelectedTenant(null)
          tenant.onTenantSuccess()
        }}
      />

      <DeleteTenantModal
        isOpen={tenant.isDeleteTenantModalOpen}
        tenant={tenant.selectedTenant}
        onClose={() => {
          tenant.setIsDeleteTenantModalOpen(false)
          tenant.setSelectedTenant(null)
        }}
        onSuccess={tenant.onTenantSuccess}
      />

      {/* User Modals */}
      <AddUserModal
        isOpen={user.isAddUserModalOpen}
        onClose={() => user.setIsAddUserModalOpen(false)}
        onSuccess={user.onUserSuccess}
      />

      <EditUserModal
        isOpen={user.isEditUserModalOpen}
        user={user.selectedUser}
        onClose={() => {
          user.setIsEditUserModalOpen(false)
          user.setSelectedUser(null)
        }}
        onSuccess={user.onUserSuccess}
        onDelete={() => {
          user.setIsEditUserModalOpen(false)
          user.setSelectedUser(null)
          user.onUserSuccess()
        }}
      />

      <DeleteUserModal
        isOpen={user.isDeleteUserModalOpen}
        user={user.selectedUser}
        onClose={() => {
          user.setIsDeleteUserModalOpen(false)
          user.setSelectedUser(null)
        }}
        onSuccess={user.onUserSuccess}
      />

      <ResetPasswordModal
        isOpen={user.isResetPasswordModalOpen}
        user={user.selectedUser}
        onClose={() => {
          user.setIsResetPasswordModalOpen(false)
          user.setSelectedUser(null)
        }}
        onSuccess={user.onUserSuccess}
      />

      {/* Bulk Delete Users Confirmation Modal */}
      <BulkDeleteUsersModal
        isOpen={user.showUsersBulkDeleteConfirm}
        selectedCount={user.selectedUserIds.size}
        isDeleting={user.isUsersBulkDeleting}
        deleteError={user.usersBulkDeleteError}
        onClose={() => {
          user.setShowUsersBulkDeleteConfirm(false)
          user.setUsersBulkDeleteError(null)
        }}
        onConfirm={user.handleBulkDeleteUsers}
      />

      {/* View QR Modal */}
      <ViewQRModal
        isOpen={qr.isViewQRModalOpen}
        qr={qr.selectedQR}
        onClose={() => {
          qr.setIsViewQRModalOpen(false)
          qr.setSelectedQR(null)
        }}
      />

      {/* Delete QR Modal */}
      <DeleteQRModal
        isOpen={qr.isDeleteQRModalOpen}
        qr={qr.selectedQR}
        isDeleting={qr.isDeleting}
        deleteError={qr.deleteError}
        onClose={() => {
          qr.setIsDeleteQRModalOpen(false)
          qr.setSelectedQR(null)
          qr.setDeleteError(null)
        }}
        onConfirm={qr.confirmDeleteQR}
      />

      {/* Bulk Delete QR Confirmation Modal */}
      <BulkDeleteQRModal
        isOpen={qr.showBulkDeleteConfirm}
        filteredCount={qr.filteredQRCodes.length}
        hasFilters={!!(qr.qrStatusFilter || qr.qrBatchFilter || qr.qrSearchQuery || qr.qrAssignmentFilter || qr.qrTenantFilter)}
        isBulkDeleting={qr.isBulkDeleting}
        bulkDeleteProgress={qr.bulkDeleteProgress}
        bulkDeleteError={qr.bulkDeleteError}
        onClose={() => {
          qr.setShowBulkDeleteConfirm(false)
          qr.setBulkDeleteError(null)
        }}
        onConfirm={qr.handleBulkDelete}
      />

      {/* Impersonate Tenant Admin Modal */}
      <ImpersonateTenantModal
        isOpen={impersonation.isImpersonateModalOpen}
        tenant={impersonation.impersonateTenant}
        tenantAdmins={impersonation.tenantAdmins}
        isLoadingAdmins={impersonation.isLoadingAdmins}
        isImpersonating={impersonation.isImpersonating}
        impersonateError={impersonation.impersonateError}
        onClose={impersonation.closeImpersonationModal}
        onConfirm={impersonation.confirmImpersonation}
      />
    </>
  )
}

export default SuperAdminModals
