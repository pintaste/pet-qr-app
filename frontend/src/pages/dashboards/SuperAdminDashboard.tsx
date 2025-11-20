import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Users,
  User,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  Search,
  Plus,
  Filter,
  Download,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Grid3X3,
  List,
  Calendar,
  Globe,
  LogIn,
  Clock,
  PawPrint,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  MoreHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { superAdminService, PlatformStats, Tenant, PlatformUser } from '@/services/superAdminService'
import { impersonationService } from '@/services/impersonationService'
import { useImpersonationStore } from '@/stores/impersonationStore'
import { GenerateQRModal } from '@/components/GenerateQRModal'
import { QRCard, QRCardSkeleton, QRCodeData } from '@/components/QRCard'
import { qrService } from '@/services/qrService'
import { AddTenantModal } from '@/components/AddTenantModal'
import { EditTenantModal } from '@/components/EditTenantModal'
import { DeleteTenantModal } from '@/components/DeleteTenantModal'
import { TenantCard, NoTenantsCard, TenantCardSkeleton } from '@/components/TenantCard'
import { UserCard, UserCardSkeleton } from '@/components/UserCard'
import { AddUserModal } from '@/components/AddUserModal'
import { EditUserModal } from '@/components/EditUserModal'
import { DeleteUserModal } from '@/components/DeleteUserModal'
import { ResetPasswordModal } from '@/components/ResetPasswordModal'
import QRCodeLib from 'qrcode'
import JSZip from 'jszip'

type SuperAdminTab = 'overview' | 'tenants' | 'users' | 'qr-factory' | 'analytics' | 'subscriptions' | 'settings'

/**
 * Super Admin Dashboard
 *
 * For platform owners to manage all tenants, generate QR batches, and view platform analytics.
 */
const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { startImpersonation } = useImpersonationStore()

  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview')
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerateQRModalOpen, setIsGenerateQRModalOpen] = useState(false)
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([])
  const [isQRsLoading, setIsQRsLoading] = useState(false)

  // Impersonation states
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false)
  const [impersonateTenant, setImpersonateTenant] = useState<Tenant | null>(null)
  const [tenantAdmins, setTenantAdmins] = useState<PlatformUser[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)

  // Tenant modal states
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false)
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false)
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isTenantsLoading, setIsTenantsLoading] = useState(false)

  // User management states
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [userTenantFilter, setUserTenantFilter] = useState<string>('')

  // QR Factory states
  const [qrSearchQuery, setQrSearchQuery] = useState('')
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('')
  const [qrBatchFilter, setQrBatchFilter] = useState<string>('')
  const [qrTenantFilter, setQrTenantFilter] = useState<string>('')
  const [qrAssignmentFilter, setQrAssignmentFilter] = useState<string>('')
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [isDeleteQRModalOpen, setIsDeleteQRModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [viewQRImageUrl, setViewQRImageUrl] = useState<string>('')
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

  // QR Pagination states
  const [qrCurrentPage, setQrCurrentPage] = useState(1)
  const QR_PER_PAGE = 100

  // Tenants Pagination states
  const [tenantsCurrentPage, setTenantsCurrentPage] = useState(1)
  const TENANTS_PER_PAGE = 100

  // Users Pagination states
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const USERS_PER_PAGE = 100

  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState(false)

  // View mode states (grid or list) - default to list view
  const [tenantsViewMode, setTenantsViewMode] = useState<'grid' | 'list'>('list')
  const [qrViewMode, setQrViewMode] = useState<'grid' | 'list'>('list')
  const [usersViewMode, setUsersViewMode] = useState<'grid' | 'list'>('list')

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than 300px
      const scrolled = window.scrollY > 300
      setShowBackToTop(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fetch platform stats
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        setIsLoading(true)
        const stats = await superAdminService.getPlatformStats()
        setPlatformStats(stats)
        setError(null)
      } catch (err) {
        console.error('Error fetching platform stats:', err)
        setError('Failed to load platform statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatformStats()
  }, [])

  // Fetch tenants when tenants or QR Factory tab is active
  useEffect(() => {
    const fetchTenants = async () => {
      if (activeTab === 'tenants' || activeTab === 'qr-factory') {
        try {
          if (activeTab === 'tenants') {
            setIsTenantsLoading(true)
          }
          const tenantList = await superAdminService.listTenants()
          setTenants(tenantList)
        } catch (err) {
          console.error('Error fetching tenants:', err)
        } finally {
          setIsTenantsLoading(false)
        }
      }
    }

    fetchTenants()
  }, [activeTab])

  // Tenant CRUD handlers
  const handleCreateTenant = () => {
    setIsAddTenantModalOpen(true)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsEditTenantModalOpen(true)
  }

  const handleDeleteTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsDeleteTenantModalOpen(true)
  }

  const handleTenantSuccess = async () => {
    // Refresh tenant list
    try {
      const tenantList = await superAdminService.listTenants()
      setTenants(tenantList)

      // Refresh platform stats
      const stats = await superAdminService.getPlatformStats()
      setPlatformStats(stats)
    } catch (err) {
      console.error('Error refreshing after tenant operation:', err)
    }
  }

  // Fetch users when users tab is active or filters change
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'users') {
        try {
          setIsUsersLoading(true)
          const userList = await superAdminService.listAllUsers({
            search: userSearchQuery || undefined,
            role: userRoleFilter || undefined,
            tenant_id: userTenantFilter ? parseInt(userTenantFilter) : undefined,
          })
          setUsers(userList)
        } catch (err) {
          console.error('Error fetching users:', err)
        } finally {
          setIsUsersLoading(false)
        }
      }
    }

    fetchUsers()
  }, [activeTab, userSearchQuery, userRoleFilter, userTenantFilter])

  // Also fetch tenants for the filter dropdown when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && tenants.length === 0) {
      superAdminService.listTenants().then(setTenants).catch(console.error)
    }
  }, [activeTab, tenants.length])

  // Generate QR code image when view modal opens
  useEffect(() => {
    const generateQRImage = async () => {
      if (isViewQRModalOpen && selectedQR) {
        try {
          const qrUrl = `${window.location.origin}/qr/${selectedQR.code}`
          const dataUrl = await QRCodeLib.toDataURL(qrUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
          setViewQRImageUrl(dataUrl)
        } catch (error) {
          console.error('Error generating QR code image:', error)
          setViewQRImageUrl('')
        }
      } else {
        setViewQRImageUrl('')
      }
    }
    generateQRImage()
  }, [isViewQRModalOpen, selectedQR])

  // User CRUD handlers
  const handleCreateUser = () => {
    setIsAddUserModalOpen(true)
  }

  const handleEditUser = (user: PlatformUser) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }

  const handleDeleteUser = (user: PlatformUser) => {
    setSelectedUser(user)
    setIsDeleteUserModalOpen(true)
  }

  const handleResetPassword = (user: PlatformUser) => {
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleImpersonateUser = async (user: PlatformUser) => {
    // Can only impersonate tenant_admin or user, not super_admin
    if (user.role === 'super_admin') {
      return
    }

    // For tenant admins and users, we need their tenant
    if (!user.tenant_id) {
      return
    }

    try {
      // Find the tenant for this user
      const tenant = tenants.find(t => t.id === user.tenant_id)
      if (!tenant) {
        console.error('Tenant not found for user')
        return
      }

      // Start impersonation
      await startImpersonation({
        userId: user.id,
        tenantId: tenant.id,
        tenantName: tenant.name,
        userEmail: user.email,
        userRole: user.role,
      })

      // Navigate to tenant dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to impersonate user:', err)
    }
  }

  const handleUserSuccess = async () => {
    // Refresh user list
    try {
      const userList = await superAdminService.listAllUsers({
        search: userSearchQuery || undefined,
        role: userRoleFilter || undefined,
        tenant_id: userTenantFilter ? parseInt(userTenantFilter) : undefined,
      })
      setUsers(userList)

      // Refresh platform stats
      const stats = await superAdminService.getPlatformStats()
      setPlatformStats(stats)
    } catch (err) {
      console.error('Error refreshing after user operation:', err)
    }
  }

  // Impersonation handler
  const handleImpersonateTenant = async (tenant: Tenant) => {
    setImpersonateTenant(tenant)
    setImpersonateError(null)
    setIsLoadingAdmins(true)
    setIsImpersonateModalOpen(true)

    try {
      // Fetch tenant admins for this tenant
      const admins = await superAdminService.listAllUsers({
        tenant_id: tenant.id,
        role: 'tenant_admin'
      })
      setTenantAdmins(admins)

      // If there's only one admin, we can auto-select
      if (admins.length === 0) {
        setImpersonateError('No tenant admin found for this tenant')
      }
    } catch (err) {
      console.error('Error fetching tenant admins:', err)
      setImpersonateError('Failed to fetch tenant admins')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  const confirmImpersonation = async (userId: number) => {
    setIsImpersonating(true)
    setImpersonateError(null)

    try {
      await impersonationService.startImpersonation(userId)

      // Update impersonation store
      const user = tenantAdmins.find(u => u.id === userId)
      if (user) {
        startImpersonation({
          id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id || undefined
        })
      }

      // Close modal and navigate to tenant admin dashboard
      setIsImpersonateModalOpen(false)
      setImpersonateTenant(null)
      setTenantAdmins([])
      navigate('/dashboard/tenant-admin')
    } catch (err) {
      console.error('Error starting impersonation:', err)
      setImpersonateError(err instanceof Error ? err.message : 'Failed to start impersonation')
    } finally {
      setIsImpersonating(false)
    }
  }

  // Fetch QR codes when QR Factory tab is active
  useEffect(() => {
    const fetchQRCodes = async () => {
      if (activeTab !== 'qr-factory') return

      try {
        setIsQRsLoading(true)
        const codes = await superAdminService.getAllQRCodes({ limit: 1000000 })
        setQRCodes(codes || [])
      } catch (err) {
        console.error('[SuperAdminDashboard] Error fetching QR codes:', err)
      } finally {
        setIsQRsLoading(false)
      }
    }

    fetchQRCodes()
  }, [activeTab])

  const handleGenerateQR = () => {
    setIsGenerateQRModalOpen(true)
  }

  const handleQRGenerateSuccess = async () => {
    console.log('[SuperAdminDashboard] QR codes generated successfully')

    // Refresh QR codes list
    try {
      const codes = await superAdminService.getAllQRCodes({ limit: 1000000 })
      setQRCodes(codes || [])

      // Refresh platform stats
      const stats = await superAdminService.getPlatformStats()
      setPlatformStats(stats)
    } catch (error) {
      console.error('[SuperAdminDashboard] Error refreshing after QR generation:', error)
    }
  }

  // QR Code action handlers
  const handleViewQR = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }

  const handleDownloadQR = async (qr: QRCodeData, style: 'scanner' | 'rounded' = 'scanner') => {
    try {
      // Generate QR code URL
      const qrUrl = `${window.location.origin}/qr/${qr.code}`

      // Create a canvas to generate QR image with PIN
      const QRCode = await import('qrcode')

      // First generate the QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })

      // Create a canvas to combine QR code with styled frame
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      const qrSize = 300
      const padding = 40
      const footerHeight = 80
      canvas.width = qrSize + (padding * 2)
      canvas.height = qrSize + (padding * 2) + footerHeight

      // Fill white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw QR code
      const qrImage = new Image()
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve()
        qrImage.onerror = reject
        qrImage.src = qrDataUrl
      })

      const qrX = padding
      const qrY = padding
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

      // Draw style-specific frame
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4

      if (style === 'scanner') {
        // Scanner corners style (viewfinder brackets)
        const cornerLength = 40
        const cornerOffset = 8

        // Top-left corner
        ctx.beginPath()
        ctx.moveTo(qrX - cornerOffset, qrY - cornerOffset + cornerLength)
        ctx.lineTo(qrX - cornerOffset, qrY - cornerOffset)
        ctx.lineTo(qrX - cornerOffset + cornerLength, qrY - cornerOffset)
        ctx.stroke()

        // Top-right corner
        ctx.beginPath()
        ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY - cornerOffset)
        ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset)
        ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset + cornerLength)
        ctx.stroke()

        // Bottom-left corner
        ctx.beginPath()
        ctx.moveTo(qrX - cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
        ctx.lineTo(qrX - cornerOffset, qrY + qrSize + cornerOffset)
        ctx.lineTo(qrX - cornerOffset + cornerLength, qrY + qrSize + cornerOffset)
        ctx.stroke()

        // Bottom-right corner
        ctx.beginPath()
        ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY + qrSize + cornerOffset)
        ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset)
        ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
        ctx.stroke()

      } else {
        // Rounded border style
        const borderRadius = 20
        const borderOffset = 8
        ctx.beginPath()
        ctx.roundRect(
          qrX - borderOffset,
          qrY - borderOffset,
          qrSize + (borderOffset * 2),
          qrSize + (borderOffset * 2),
          borderRadius
        )
        ctx.stroke()
      }

      // Draw footer info
      const footerY = qrY + qrSize + padding

      // Draw code
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(qr.code, canvas.width / 2, footerY)

      // Draw PIN
      ctx.fillStyle = '#4f46e5'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(`PIN: ${qr.pin}`, canvas.width / 2, footerY + 35)

      // Download the combined image
      const finalDataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = finalDataUrl
      link.download = `PetQR-${qr.code}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('[SuperAdminDashboard] Error downloading QR:', error)
    }
  }

  const handleDeleteQR = (qr: QRCodeData) => {
    setSelectedQR(qr)
    setDeleteError(null)
    setIsDeleteQRModalOpen(true)
  }

  // Bulk download filtered QR codes as ZIP
  const handleBulkDownload = async (style: 'scanner' | 'rounded' = 'scanner') => {
    if (filteredQRCodes.length === 0) return

    setIsBulkDownloading(true)
    setBulkDownloadProgress(0)

    try {
      const zip = new JSZip()
      const QRCode = await import('qrcode')

      for (let i = 0; i < filteredQRCodes.length; i++) {
        const qr = filteredQRCodes[i]
        const qrUrl = `${window.location.origin}/qr/${qr.code}`

        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 300,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        })

        // Create canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        const qrSize = 300
        const padding = 40
        const footerHeight = 80
        canvas.width = qrSize + (padding * 2)
        canvas.height = qrSize + (padding * 2) + footerHeight

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw QR code
        const qrImage = new Image()
        await new Promise<void>((resolve, reject) => {
          qrImage.onload = () => resolve()
          qrImage.onerror = reject
          qrImage.src = qrDataUrl
        })

        const qrX = padding
        const qrY = padding
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

        // Draw style-specific frame
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 4

        if (style === 'scanner') {
          const cornerLength = 40
          const cornerOffset = 8
          // Top-left
          ctx.beginPath()
          ctx.moveTo(qrX - cornerOffset, qrY - cornerOffset + cornerLength)
          ctx.lineTo(qrX - cornerOffset, qrY - cornerOffset)
          ctx.lineTo(qrX - cornerOffset + cornerLength, qrY - cornerOffset)
          ctx.stroke()
          // Top-right
          ctx.beginPath()
          ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY - cornerOffset)
          ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset)
          ctx.lineTo(qrX + qrSize + cornerOffset, qrY - cornerOffset + cornerLength)
          ctx.stroke()
          // Bottom-left
          ctx.beginPath()
          ctx.moveTo(qrX - cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
          ctx.lineTo(qrX - cornerOffset, qrY + qrSize + cornerOffset)
          ctx.lineTo(qrX - cornerOffset + cornerLength, qrY + qrSize + cornerOffset)
          ctx.stroke()
          // Bottom-right
          ctx.beginPath()
          ctx.moveTo(qrX + qrSize + cornerOffset - cornerLength, qrY + qrSize + cornerOffset)
          ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset)
          ctx.lineTo(qrX + qrSize + cornerOffset, qrY + qrSize + cornerOffset - cornerLength)
          ctx.stroke()
        } else {
          const borderRadius = 20
          const borderOffset = 8
          ctx.beginPath()
          ctx.roundRect(qrX - borderOffset, qrY - borderOffset, qrSize + (borderOffset * 2), qrSize + (borderOffset * 2), borderRadius)
          ctx.stroke()
        }

        // Draw footer
        const footerY = qrY + qrSize + padding
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(qr.code, canvas.width / 2, footerY)
        ctx.fillStyle = '#4f46e5'
        ctx.font = 'bold 24px monospace'
        ctx.fillText(`PIN: ${qr.pin}`, canvas.width / 2, footerY + 35)

        // Convert to blob and add to zip
        const dataUrl = canvas.toDataURL('image/png')
        const base64Data = dataUrl.split(',')[1]
        zip.file(`PetQR-${qr.code}.png`, base64Data, { base64: true })

        setBulkDownloadProgress(Math.round(((i + 1) / filteredQRCodes.length) * 100))
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `PetQR-Batch-${qrBatchFilter || 'All'}-${style}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('[SuperAdminDashboard] Error bulk downloading QR codes:', error)
    } finally {
      setIsBulkDownloading(false)
      setBulkDownloadProgress(0)
    }
  }

  const confirmDeleteQR = async () => {
    if (!selectedQR) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await qrService.deleteQRCode(selectedQR.id)

      // Refresh QR codes
      const codes = await superAdminService.getAllQRCodes({ limit: 1000000 })
      setQRCodes(codes || [])

      // Refresh stats
      const stats = await superAdminService.getPlatformStats()
      setPlatformStats(stats)

      setIsDeleteQRModalOpen(false)
      setSelectedQR(null)
    } catch (error) {
      console.error('[SuperAdminDashboard] Error deleting QR:', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete QR code')
    } finally {
      setIsDeleting(false)
    }
  }

  // Bulk delete filtered QR codes
  const handleBulkDelete = async () => {
    if (filteredQRCodes.length === 0) return

    setIsBulkDeleting(true)
    setBulkDeleteProgress(0)
    setBulkDeleteError(null)

    try {
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < filteredQRCodes.length; i++) {
        const qr = filteredQRCodes[i]
        try {
          await qrService.deleteQRCode(qr.id)
          successCount++
        } catch (err) {
          console.error(`[SuperAdminDashboard] Failed to delete QR ${qr.code}:`, err)
          failCount++
        }
        setBulkDeleteProgress(Math.round(((i + 1) / filteredQRCodes.length) * 100))
      }

      // Refresh QR codes
      const codes = await superAdminService.getAllQRCodes({ limit: 1000000 })
      setQRCodes(codes || [])

      // Refresh stats
      const stats = await superAdminService.getPlatformStats()
      setPlatformStats(stats)

      if (failCount > 0) {
        setBulkDeleteError(`Deleted ${successCount} QR codes. Failed to delete ${failCount}.`)
      }

      setShowBulkDeleteConfirm(false)
    } catch (error) {
      console.error('[SuperAdminDashboard] Error bulk deleting QR codes:', error)
      setBulkDeleteError(error instanceof Error ? error.message : 'Failed to delete QR codes')
    } finally {
      setIsBulkDeleting(false)
      setBulkDeleteProgress(0)
    }
  }

  // Filter QR codes based on search and status
  // Get unique batch IDs for filter dropdown
  const uniqueBatches = [...new Set(qrCodes.map(qr => qr.batch_id).filter(Boolean))] as string[]

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = !qrSearchQuery ||
      qr.code.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
      qr.batch_id?.toLowerCase().includes(qrSearchQuery.toLowerCase())
    const matchesStatus = !qrStatusFilter || qr.status.toLowerCase() === qrStatusFilter.toLowerCase()
    const matchesBatch = !qrBatchFilter || qr.batch_id === qrBatchFilter
    const matchesAssignment = !qrAssignmentFilter ||
      (qrAssignmentFilter === 'assigned' && qr.pet_id) ||
      (qrAssignmentFilter === 'unassigned' && !qr.pet_id)
    return matchesSearch && matchesStatus && matchesBatch && matchesAssignment
  })

  // Calculate pagination for QR codes
  const qrTotalPages = Math.ceil(filteredQRCodes.length / QR_PER_PAGE)
  const qrStartIndex = (qrCurrentPage - 1) * QR_PER_PAGE
  const qrEndIndex = qrStartIndex + QR_PER_PAGE
  const paginatedQRCodes = filteredQRCodes.slice(qrStartIndex, qrEndIndex)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setQrCurrentPage(1)
  }, [qrSearchQuery, qrStatusFilter, qrBatchFilter, qrAssignmentFilter])

  // Calculate pagination for tenants
  const tenantsTotalPages = Math.ceil(tenants.length / TENANTS_PER_PAGE)
  const tenantsStartIndex = (tenantsCurrentPage - 1) * TENANTS_PER_PAGE
  const tenantsEndIndex = tenantsStartIndex + TENANTS_PER_PAGE
  const paginatedTenants = tenants.slice(tenantsStartIndex, tenantsEndIndex)

  // Reset tenants page when tenants change
  React.useEffect(() => {
    setTenantsCurrentPage(1)
  }, [tenants.length])

  // Calculate pagination for users
  const usersTotalPages = Math.ceil(users.length / USERS_PER_PAGE)
  const usersStartIndex = (usersCurrentPage - 1) * USERS_PER_PAGE
  const usersEndIndex = usersStartIndex + USERS_PER_PAGE
  const paginatedUsers = users.slice(usersStartIndex, usersEndIndex)

  // Reset users page when users or filters change
  React.useEffect(() => {
    setUsersCurrentPage(1)
  }, [userSearchQuery, userRoleFilter, userTenantFilter])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'tenants' as const, label: 'Tenants', icon: Building2, count: tenants.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'qr-factory' as const, label: 'QR Factory', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: CreditCard },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading platform statistics...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Platform Stats & Quick Actions Combined */}
            {!isLoading && !error && platformStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('tenants')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tenants</h3>
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_tenants}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{platformStats.active_tenants} active</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to manage tenants →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_users}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{platformStats.active_users} active</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to manage users →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('qr-factory')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">QR Codes Generated</h3>
                    <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_qr_codes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform-wide</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to generate QR codes →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_scans}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view analytics →
                  </p>
                </button>
              </div>
            )}

            {/* Platform Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Recent Platform Activity
                </h2>
                <button className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
                  View All →
                </button>
              </div>
              {/* Activity Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                  All
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Tenants
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Users
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  QR Codes
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Pets
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Security
                </button>
              </div>
              <div className="space-y-3">
                {/* Fake activity data */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      New tenant <span className="font-semibold">Happy Paws Clinic</span> registered
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">5 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      User <span className="font-semibold">john@petcare.com</span> created account
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">12 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      QR code <span className="font-semibold">PQR-7X9K2M</span> scanned in Vancouver, BC
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">28 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Password reset for <span className="font-semibold">admin@vetclinic.com</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <PawPrint className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Pet <span className="font-semibold">Buddy</span> profile updated by owner
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">PetSmart Downtown</span> upgraded to Premium plan
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'tenants':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Management</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage all tenants and their configurations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setTenantsViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      tenantsViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setTenantsViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      tenantsViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <button
                  onClick={handleCreateTenant}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  Create New Tenant
                </button>
              </div>
            </div>

            {/* Tenants Grid/List */}
            {isTenantsLoading ? (
              tenantsViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TenantCardSkeleton />
                  <TenantCardSkeleton />
                  <TenantCardSkeleton />
                </div>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              )
            ) : tenants.length === 0 ? (
              <NoTenantsCard onCreate={handleCreateTenant} />
            ) : tenantsViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTenants.map((tenant) => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                    onEdit={handleEditTenant}
                    onImpersonate={handleImpersonateTenant}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tier / Users</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Expires</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{tenant.name}</p>
                            {tenant.subdomain && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {tenant.subdomain}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tenant.tier === 'enterprise' ? 'Enterprise' : 'Standard'}
                            </p>
                            {tenant.user_count !== undefined && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {tenant.user_count} users
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            tenant.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {tenant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tenant.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {tenant.subscription_expires_at ? (
                            <span className={`text-sm flex items-center gap-1 ${
                              new Date(tenant.subscription_expires_at) < new Date()
                                ? 'text-red-600 dark:text-red-400'
                                : new Date(tenant.subscription_expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {new Date(tenant.subscription_expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleImpersonateTenant(tenant)}
                              className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors"
                              title={`Impersonate ${tenant.name} Admin`}
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditTenant(tenant)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                              title={`Edit ${tenant.name}`}
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tenants Pagination */}
            {tenantsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 py-3">
                <button
                  onClick={() => setTenantsCurrentPage(1)}
                  disabled={tenantsCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setTenantsCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={tenantsCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {tenantsCurrentPage} of {tenantsTotalPages}
                </span>
                <button
                  onClick={() => setTenantsCurrentPage(prev => Math.min(tenantsTotalPages, prev + 1))}
                  disabled={tenantsCurrentPage === tenantsTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setTenantsCurrentPage(tenantsTotalPages)}
                  disabled={tenantsCurrentPage === tenantsTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )

      case 'qr-factory':
        return (
          <div className="space-y-6">
            {/* Header with Generate Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Factory</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Generate and manage QR code batches for the platform
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setQrViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      qrViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setQrViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      qrViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Actions Dropdown - combines Bulk Delete and Bulk Download */}
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    disabled={filteredQRCodes.length === 0 || isBulkDeleting || isBulkDownloading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting {bulkDeleteProgress}%
                      </>
                    ) : isBulkDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading {bulkDownloadProgress}%
                      </>
                    ) : (
                      <>
                        <MoreHorizontal className="w-4 h-4" />
                        Actions
                      </>
                    )}
                  </button>
                  {showActionsMenu && !isBulkDeleting && !isBulkDownloading && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      {/* Download Options */}
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Download
                      </div>
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          handleBulkDownload('scanner')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Scanner Style
                      </button>
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          handleBulkDownload('rounded')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Rounded Style
                      </button>

                      {/* Divider */}
                      <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                      {/* Delete Option */}
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          setShowBulkDeleteConfirm(true)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete All Filtered ({filteredQRCodes.length})
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateQR}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Generate QR Batch
                </button>
              </div>
            </div>

            {/* Stats Cards - Clickable to filter */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  setQrStatusFilter('')
                  setQrAssignmentFilter('')
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg text-left ${
                  !qrStatusFilter && !qrAssignmentFilter
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                    : 'border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Generated</h3>
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{qrCodes.length}</p>
              </button>

              <button
                onClick={() => {
                  setQrStatusFilter('active')
                  setQrAssignmentFilter('')
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg text-left ${
                  qrStatusFilter === 'active' && !qrAssignmentFilter
                    ? 'border-green-500 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                    : 'border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</h3>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {qrCodes.filter(qr => qr.status === 'active').length}
                </p>
              </button>

              <button
                onClick={() => {
                  setQrStatusFilter('')
                  setQrAssignmentFilter('assigned')
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg text-left ${
                  qrAssignmentFilter === 'assigned'
                    ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to Pets</h3>
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {qrCodes.filter(qr => qr.pet_id).length}
                </p>
              </button>

              <button
                onClick={() => {
                  setQrStatusFilter('')
                  setQrAssignmentFilter('unassigned')
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg text-left ${
                  qrAssignmentFilter === 'unassigned'
                    ? 'border-gray-500 dark:border-gray-500 ring-2 ring-gray-200 dark:ring-gray-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned</h3>
                  <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {qrCodes.filter(qr => !qr.pet_id).length}
                </p>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                {/* Row 1: Search (full width) */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by code or batch ID..."
                    value={qrSearchQuery}
                    onChange={(e) => setQrSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Row 2: Filter dropdowns (evenly distributed) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Status Filter */}
                  <select
                    value={qrStatusFilter}
                    onChange={(e) => setQrStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>

                  {/* Batch Filter */}
                  <select
                    value={qrBatchFilter}
                    onChange={(e) => setQrBatchFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Batches</option>
                    {uniqueBatches.map(batchId => (
                      <option key={batchId} value={batchId}>
                        {batchId}
                      </option>
                    ))}
                  </select>

                  {/* Tenant Filter */}
                  <select
                    value={qrTenantFilter}
                    onChange={(e) => setQrTenantFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Tenants</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id.toString()}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>

                  {/* Assignment Filter */}
                  <select
                    value={qrAssignmentFilter}
                    onChange={(e) => setQrAssignmentFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Assignment</option>
                    <option value="assigned">Assigned</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(qrSearchQuery || qrStatusFilter || qrBatchFilter || qrTenantFilter || qrAssignmentFilter) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredQRCodes.length} of {qrCodes.length} QR codes
                  </span>
                  <button
                    onClick={() => {
                      setQrSearchQuery('')
                      setQrStatusFilter('')
                      setQrBatchFilter('')
                      setQrTenantFilter('')
                      setQrAssignmentFilter('')
                    }}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* QR Codes Grid/List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generated QR Codes</h3>

              {isQRsLoading ? (
                qrViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QRCardSkeleton />
                    <QRCardSkeleton />
                    <QRCardSkeleton />
                    <QRCardSkeleton />
                    <QRCardSkeleton />
                    <QRCardSkeleton />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                )
              ) : filteredQRCodes.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {qrCodes.length === 0 ? 'No QR Codes Generated Yet' : 'No QR Codes Found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {qrCodes.length === 0
                      ? 'Click "Generate QR Batch" to create your first batch of QR codes'
                      : 'Try adjusting your search or filters'}
                  </p>
                  {qrCodes.length === 0 && (
                    <button
                      onClick={handleGenerateQR}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Generate QR Batch
                    </button>
                  )}
                </div>
              ) : qrViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedQRCodes.map((qr) => (
                    <QRCard
                      key={qr.id}
                      qr={qr}
                      onView={handleViewQR}
                      onDownload={handleDownloadQR}
                      onDelete={handleDeleteQR}
                    />
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">PIN</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Batch</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pet</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQRCodes.map((qr) => (
                        <tr key={qr.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">{qr.code}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{qr.pin}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              qr.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              qr.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}>{qr.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{qr.batch_id || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {qr.pet_name || (qr.pet_id ? `Pet #${qr.pet_id}` : '-')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(qr.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewQR(qr)}
                                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded transition-colors"
                                title="View"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadQR(qr)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQR(qr)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {!isQRsLoading && filteredQRCodes.length > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {qrStartIndex + 1}-{Math.min(qrEndIndex, filteredQRCodes.length)} of {filteredQRCodes.length} QR codes
                  </p>
                  {qrTotalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQrCurrentPage(1)}
                        disabled={qrCurrentPage === 1}
                        className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="First page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQrCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={qrCurrentPage === 1}
                        className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                        Page {qrCurrentPage} of {qrTotalPages}
                      </span>
                      <button
                        onClick={() => setQrCurrentPage(prev => Math.min(qrTotalPages, prev + 1))}
                        disabled={qrCurrentPage === qrTotalPages}
                        className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQrCurrentPage(qrTotalPages)}
                        disabled={qrCurrentPage === qrTotalPages}
                        className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Last page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'users':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage all users across the platform. Filter by role or tenant.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setUsersViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      usersViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setUsersViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      usersViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create User
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Role Filter */}
                <div className="md:w-48">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>

                {/* Tenant Filter */}
                <div className="md:w-48">
                  <select
                    value={userTenantFilter}
                    onChange={(e) => setUserTenantFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">All Tenants</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(userSearchQuery || userRoleFilter || userTenantFilter) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {users.length} users
                    {userSearchQuery && ` matching "${userSearchQuery}"`}
                  </span>
                  <button
                    onClick={() => {
                      setUserSearchQuery('')
                      setUserRoleFilter('')
                      setUserTenantFilter('')
                    }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline ml-auto"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Users Grid/List */}
            {isUsersLoading ? (
              usersViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                </div>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              )
            ) : users.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {userSearchQuery || userRoleFilter || userTenantFilter
                    ? 'No Users Found'
                    : 'No Users Yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {userSearchQuery || userRoleFilter || userTenantFilter
                    ? 'Try adjusting your search or filters'
                    : 'Click "Create User" to add a Super Admin or Tenant Admin'}
                </p>
                {!userSearchQuery && !userRoleFilter && !userTenantFilter && (
                  <button
                    onClick={handleCreateUser}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create User
                  </button>
                )}
              </div>
            ) : usersViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onImpersonate={handleImpersonateUser}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : user.role === 'tenant_admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'tenant_admin' ? 'Tenant Admin' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.tenant_name || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {user.role !== 'super_admin' && (
                              <button
                                onClick={() => handleImpersonateUser(user)}
                                className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors"
                                title={`Impersonate ${user.email}`}
                              >
                                <LogIn className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                              title={`Edit ${user.email}`}
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* User Count Summary */}
            {/* Users Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 py-3">
                <button
                  onClick={() => setUsersCurrentPage(1)}
                  disabled={usersCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setUsersCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={usersCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {usersCurrentPage} of {usersTotalPages}
                </span>
                <button
                  onClick={() => setUsersCurrentPage(prev => Math.min(usersTotalPages, prev + 1))}
                  disabled={usersCurrentPage === usersTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setUsersCurrentPage(usersTotalPages)}
                  disabled={usersCurrentPage === usersTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}

            {!isUsersLoading && users.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {usersStartIndex + 1}-{Math.min(usersEndIndex, users.length)} of {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Platform Analytics</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Analytics charts will be displayed here (real-time data with polling)
            </p>
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Platform Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Platform configuration options will be available here
            </p>
          </div>
        )

      case 'subscriptions':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Subscriptions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subscription management and billing features will be implemented in a future phase
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className={containerStyles.extraWide}>
          <Header variant="default" showAuthButton={true} />
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-700">
        <div className={`${containerStyles.extraWide} py-4`}>
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${containerStyles.extraWide} py-6`}>
        {renderContent()}
      </div>

      {/* Generate QR Modal */}
      <GenerateQRModal
        isOpen={isGenerateQRModalOpen}
        onClose={() => setIsGenerateQRModalOpen(false)}
        onSuccess={handleQRGenerateSuccess}
      />

      {/* Tenant Modals */}
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onSuccess={handleTenantSuccess}
      />

      <EditTenantModal
        isOpen={isEditTenantModalOpen}
        tenant={selectedTenant}
        onClose={() => {
          setIsEditTenantModalOpen(false)
          setSelectedTenant(null)
        }}
        onSuccess={handleTenantSuccess}
        onDelete={() => {
          setIsEditTenantModalOpen(false)
          setSelectedTenant(null)
          handleTenantSuccess()
        }}
      />

      <DeleteTenantModal
        isOpen={isDeleteTenantModalOpen}
        tenant={selectedTenant}
        onClose={() => {
          setIsDeleteTenantModalOpen(false)
          setSelectedTenant(null)
        }}
        onSuccess={handleTenantSuccess}
      />

      {/* User Modals */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={handleUserSuccess}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
        onDelete={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
          handleUserSuccess()
        }}
      />

      <DeleteUserModal
        isOpen={isDeleteUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsDeleteUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsResetPasswordModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      {/* View QR Modal */}
      {isViewQRModalOpen && selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                QR Code Details
              </h2>
              <button
                onClick={() => {
                  setIsViewQRModalOpen(false)
                  setSelectedQR(null)
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* QR Code Display */}
              <div className="flex justify-center p-3 bg-white rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  {viewQRImageUrl ? (
                    <img
                      src={viewQRImageUrl}
                      alt={`QR Code ${selectedQR.code}`}
                      className="w-32 h-32 mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  )}
                  <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-2">{selectedQR.code}</p>
                </div>
              </div>

              {/* Details - Compact grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-500 dark:text-gray-400">PIN</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedQR.pin}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    selectedQR.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    selectedQR.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{selectedQR.status}</span>
                </div>
                {selectedQR.batch_id && (
                  <div className="col-span-2 flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-gray-500 dark:text-gray-400">Batch</span>
                    <span className="font-mono text-gray-900 dark:text-white truncate ml-2">{selectedQR.batch_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(selectedQR.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="text-gray-500 dark:text-gray-400">Pet</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedQR.pet_id ? `#${selectedQR.pet_id}` : '-'}
                  </span>
                </div>
              </div>

              {/* Copy URL - Inline */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/qr/${selectedQR.code}`}
                  className="flex-1 px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/qr/${selectedQR.code}`)
                  }}
                  className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Footer - Compact download buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadQR(selectedQR, 'scanner')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Scanner
                </button>
                <button
                  onClick={() => handleDownloadQR(selectedQR, 'rounded')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Rounded
                </button>
                <button
                  onClick={() => {
                    setIsViewQRModalOpen(false)
                    setSelectedQR(null)
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete QR Modal */}
      {isDeleteQRModalOpen && selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                Delete QR Code
              </h2>
              <button
                onClick={() => {
                  setIsDeleteQRModalOpen(false)
                  setSelectedQR(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{deleteError}</p>
                </div>
              )}

              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to delete this QR code?
                </p>
                <p className="font-mono font-bold text-lg text-gray-900 dark:text-white mb-4">
                  {selectedQR.code}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  This action cannot be undone. {selectedQR.pet_id && 'This QR code is currently linked to a pet.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsDeleteQRModalOpen(false)
                  setSelectedQR(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQR}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                Bulk Delete
              </h2>
              <button
                onClick={() => {
                  setShowBulkDeleteConfirm(false)
                  setBulkDeleteError(null)
                }}
                disabled={isBulkDeleting}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {bulkDeleteError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{bulkDeleteError}</p>
                </div>
              )}

              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {filteredQRCodes.length}
                  </span>{' '}
                  QR code{filteredQRCodes.length !== 1 ? 's' : ''}?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {qrStatusFilter || qrBatchFilter || qrSearchQuery || qrAssignmentFilter || qrTenantFilter ? (
                    <>This will delete all QR codes matching your current filters.</>
                  ) : (
                    <>This will delete ALL QR codes in the system.</>
                  )}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowBulkDeleteConfirm(false)
                  setBulkDeleteError(null)
                }}
                disabled={isBulkDeleting}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {bulkDeleteProgress}%
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Tenant Admin Modal */}
      {isImpersonateModalOpen && impersonateTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <UserCog className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                Impersonate
              </h2>
              <button
                onClick={() => {
                  setIsImpersonateModalOpen(false)
                  setImpersonateTenant(null)
                  setTenantAdmins([])
                  setImpersonateError(null)
                }}
                disabled={isImpersonating}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {impersonateError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{impersonateError}</p>
                </div>
              )}

              <div className="text-center mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Select a tenant admin to impersonate for <span className="font-bold">{impersonateTenant.name}</span>
                </p>
              </div>

              {isLoadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
              ) : tenantAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No tenant admins found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Create a tenant admin first to impersonate
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tenantAdmins.map((admin) => (
                    <button
                      key={admin.id}
                      onClick={() => confirmImpersonation(admin.id)}
                      disabled={isImpersonating}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-2 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 rounded-lg transition-all disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{admin.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tenant Admin</p>
                      </div>
                      {isImpersonating && (
                        <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsImpersonateModalOpen(false)
                  setImpersonateTenant(null)
                  setTenantAdmins([])
                  setImpersonateError(null)
                }}
                disabled={isImpersonating}
                className="w-full px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-br from-gray-200/70 to-gray-300/70 hover:from-gray-200/90 hover:to-gray-300/90 text-gray-600/80 hover:text-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-md"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default SuperAdminDashboard
