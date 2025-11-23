import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Grid3X3,
  List,
  Dog,
  Cat,
  Zap,
  UserPlus,
  Scan,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  Download,
  Link2,
  Unlink,
  CheckSquare,
} from 'lucide-react'
import { containerStyles } from '@/styles/containers'
import Header from '@/components/Header'
import { tenantAdminService, TenantStats, TenantUser, TenantQRCode, TenantPet, TenantScanEvent } from '@/services/tenantAdminService'
import { TenantUserCard, TenantUserCardSkeleton } from '@/components/tenant/TenantUserCard'
import { AddTenantUserModal, EditTenantUserModal, DeleteTenantUserModal, ResetTenantUserPasswordModal } from '@/components/tenant/TenantUserModals'
import { ViewTenantQRModal, LinkToPetModal } from '@/components/tenant/TenantQRModals'
import { downloadSingleQR } from '@/utils/qrDownloadUtils'
import SearchableSelect from '@/components/common/SearchableSelect'
import { AnalyticsTab } from './tabs/AnalyticsTab'

type TenantAdminTab = 'overview' | 'users' | 'pets' | 'qrcodes' | 'support' | 'analytics' | 'settings'

/**
 * Tenant Admin Dashboard
 *
 * For pet store owners to manage their store, users, and QR inventory.
 */
const TenantAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TenantAdminTab>('overview')
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // User management states
  const [users, setUsers] = useState<TenantUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [usersViewMode, setUsersViewMode] = useState<'grid' | 'list'>('list')
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const usersPerPage = 12
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [isUserSelectMode, setIsUserSelectMode] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

  // QR codes management states
  const [qrCodes, setQRCodes] = useState<TenantQRCode[]>([])
  const [isQRCodesLoading, setIsQRCodesLoading] = useState(false)
  const [qrSearchQuery, setQRSearchQuery] = useState('')
  const [qrStatusFilter, setQRStatusFilter] = useState<'all' | 'inactive' | 'active' | 'linked'>('all')
  const [qrBatchFilter, setQRBatchFilter] = useState<string>('all')
  const [qrUserFilter, setQRUserFilter] = useState<string>('all')
  const [qrViewMode, setQRViewMode] = useState<'grid' | 'list'>('list')
  const [qrCurrentPage, setQRCurrentPage] = useState(1)
  const qrPerPage = 12

  // QR modal states
  const [selectedQR, setSelectedQR] = useState<TenantQRCode | null>(null)
  const [isViewQRModalOpen, setIsViewQRModalOpen] = useState(false)
  const [isLinkPetModalOpen, setIsLinkPetModalOpen] = useState(false)

  // Pets management states
  const [allPets, setAllPets] = useState<TenantPet[]>([])
  const [isPetsLoading, setIsPetsLoading] = useState(false)
  const [petsViewMode, setPetsViewMode] = useState<'grid' | 'list'>('list')
  const [petsSearchQuery, setPetsSearchQuery] = useState('')
  const [petsSpeciesFilter, setPetsSpeciesFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all')
  const [petsUserFilter, setPetsUserFilter] = useState<string>('all')
  const [petsCurrentPage, setPetsCurrentPage] = useState(1)
  const petsPerPage = 12

  // Scan events states
  const [scanEvents, setScanEvents] = useState<TenantScanEvent[]>([])
  const [isScanEventsLoading, setIsScanEventsLoading] = useState(false)
  const [scanEventUserFilter, setScanEventUserFilter] = useState<string>('all')
  const [scanEventPetFilter, setScanEventPetFilter] = useState<string>('all')

  // Get unique user emails from scan events
  const scanEventUsers = useMemo(() => {
    const users = new Set<string>()
    scanEvents.forEach(event => {
      if (event.owner_email) {
        users.add(event.owner_email)
      }
    })
    return Array.from(users).sort()
  }, [scanEvents])

  // Get unique pet names for the selected user (or all if no user selected)
  const scanEventPetNames = useMemo(() => {
    const names = new Set<string>()
    scanEvents.forEach(event => {
      if (event.pet_name) {
        // Only include pets from selected user, or all if no user filter
        if (scanEventUserFilter === 'all' || event.owner_email === scanEventUserFilter) {
          names.add(event.pet_name)
        }
      }
    })
    return Array.from(names).sort()
  }, [scanEvents, scanEventUserFilter])

  // Memoize filtered scan events
  const filteredScanEvents = useMemo(() => {
    return scanEvents.filter(event => {
      // Filter by user
      if (scanEventUserFilter !== 'all' && event.owner_email !== scanEventUserFilter) {
        return false
      }
      // Filter by pet
      if (scanEventPetFilter !== 'all' && event.pet_name !== scanEventPetFilter) {
        return false
      }
      return true
    })
  }, [scanEvents, scanEventUserFilter, scanEventPetFilter])

  // Reset pet filter when user filter changes
  const handleUserFilterChange = (value: string): void => {
    setScanEventUserFilter(value)
    setScanEventPetFilter('all') // Reset pet filter when user changes
  }

  useEffect(() => {
    const fetchTenantStats = async () => {
      try {
        setIsLoading(true)
        const stats = await tenantAdminService.getTenantStats()
        setTenantStats(stats)
      } catch (err) {
        console.error('Error fetching tenant stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenantStats()
  }, [])

  // Fetch users when users tab is active
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'users') {
        try {
          setIsUsersLoading(true)
          const userList = await tenantAdminService.listTenantUsers({
            search: userSearchQuery || undefined,
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
  }, [activeTab, userSearchQuery])

  // Fetch QR codes when qrcodes tab is active
  useEffect(() => {
    const fetchQRCodes = async () => {
      if (activeTab === 'qrcodes') {
        try {
          setIsQRCodesLoading(true)
          const qrList = await tenantAdminService.listTenantQRCodes({
            search: qrSearchQuery || undefined,
          })
          setQRCodes(qrList)
        } catch (err) {
          console.error('Error fetching QR codes:', err)
        } finally {
          setIsQRCodesLoading(false)
        }
      }
    }

    fetchQRCodes()
  }, [activeTab, qrSearchQuery])

  // Fetch pets when pets tab is active
  useEffect(() => {
    const fetchPets = async () => {
      if (activeTab === 'pets') {
        try {
          setIsPetsLoading(true)
          const petList = await tenantAdminService.listTenantPets({})
          setAllPets(petList)
        } catch (err) {
          console.error('Error fetching pets:', err)
        } finally {
          setIsPetsLoading(false)
        }
      }
    }

    fetchPets()
  }, [activeTab])

  // Get unique owner emails from pets
  const petsUserEmails = useMemo(() => {
    const emails = new Set<string>()
    allPets.forEach(pet => {
      if (pet.owner_email) {
        emails.add(pet.owner_email)
      }
    })
    return Array.from(emails).sort()
  }, [allPets])

  // Client-side filtered pets
  const filteredPets = useMemo(() => {
    let result = allPets

    // Apply search filter
    if (petsSearchQuery) {
      const query = petsSearchQuery.toLowerCase()
      result = result.filter(pet =>
        pet.name.toLowerCase().includes(query) ||
        pet.owner_email?.toLowerCase().includes(query)
      )
    }

    // Apply species filter
    if (petsSpeciesFilter !== 'all') {
      if (petsSpeciesFilter === 'other') {
        result = result.filter(pet => !['dog', 'cat'].includes(pet.pet_type?.toLowerCase() || ''))
      } else {
        result = result.filter(pet => pet.pet_type?.toLowerCase() === petsSpeciesFilter)
      }
    }

    // Apply user filter
    if (petsUserFilter !== 'all') {
      result = result.filter(pet => pet.owner_email === petsUserFilter)
    }

    return result
  }, [allPets, petsSearchQuery, petsSpeciesFilter, petsUserFilter])

  // Fetch scan events when analytics tab is active
  useEffect(() => {
    const fetchScanEvents = async (): Promise<void> => {
      if (activeTab === 'analytics') {
        try {
          setIsScanEventsLoading(true)
          const events = await tenantAdminService.listTenantScanEvents({ limit: 100 })
          setScanEvents(events || [])
        } catch (err) {
          console.error('Error fetching scan events:', err)
        } finally {
          setIsScanEventsLoading(false)
        }
      }
    }

    fetchScanEvents()
  }, [activeTab])

  // User handlers
  const handleCreateUser = () => setIsAddUserModalOpen(true)
  const handleEditUser = (user: TenantUser) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }
  const handleDeleteUser = (user: TenantUser) => {
    setSelectedUser(user)
    setIsDeleteUserModalOpen(true)
  }
  const handleResetPassword = (user: TenantUser) => {
    setSelectedUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleUserSuccess = async () => {
    try {
      const userList = await tenantAdminService.listTenantUsers({
        search: userSearchQuery || undefined,
      })
      setUsers(userList)
      setSelectedUserIds(new Set())
      // Refresh stats
      const stats = await tenantAdminService.getTenantStats()
      setTenantStats(stats)
    } catch (err) {
      console.error('Error refreshing after user operation:', err)
    }
  }

  // Selection handlers
  const handleToggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleToggleUserSelectMode = () => {
    setIsUserSelectMode(prev => !prev)
    setSelectedUserIds(new Set())
  }

  const handleDeselectAllUsers = () => {
    setSelectedUserIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return

    setIsBulkDeleting(true)
    try {
      // Delete users one by one
      for (const userId of selectedUserIds) {
        await tenantAdminService.deleteUser(userId)
      }
      setShowBulkDeleteConfirm(false)
      await handleUserSuccess()
    } catch (err) {
      console.error('Error during bulk delete:', err)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // QR handlers
  const handleViewQR = (qr: TenantQRCode) => {
    setSelectedQR(qr)
    setIsViewQRModalOpen(true)
  }

  const handleDownloadQR = async (qr: TenantQRCode) => {
    try {
      await downloadSingleQR({ code: qr.code, pin: qr.pin, batch_id: qr.batch_id })
    } catch (error) {
      console.error('Failed to download QR:', error)
    }
  }

  const handleLinkToPet = (qr: TenantQRCode) => {
    setSelectedQR(qr)
    setIsLinkPetModalOpen(true)
  }

  const handleUnlinkFromPet = async (qr: TenantQRCode) => {
    // TODO: Implement unlink API call
    console.log('Unlink QR from pet:', qr.code)
    // After unlinking, refresh QR codes list
  }

  const handleQRSuccess = async () => {
    // Refresh QR codes list
    try {
      const qrList = await tenantAdminService.listTenantQRCodes({
        search: qrSearchQuery || undefined,
      })
      setQRCodes(qrList)
    } catch (err) {
      console.error('Error refreshing QR codes:', err)
    }
  }

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    let result = users

    // Apply search filter
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase()
      result = result.filter(user =>
        user.email.toLowerCase().includes(query)
      )
    }

    return result
  }, [users, userSearchQuery])

  // Pagination calculations
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (usersCurrentPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setUsersCurrentPage(1)
  }, [userSearchQuery])

  // Get unique batches for filter dropdown
  const availableBatches = useMemo(() => {
    const batches = new Set<string>()
    qrCodes.forEach(qr => {
      if (qr.batch_id) {
        batches.add(qr.batch_id)
      }
    })
    return Array.from(batches).sort()
  }, [qrCodes])

  // Get unique user emails from QR codes
  const qrUserEmails = useMemo(() => {
    const emails = new Set<string>()
    qrCodes.forEach(qr => {
      if (qr.user_email) {
        emails.add(qr.user_email)
      }
    })
    return Array.from(emails).sort()
  }, [qrCodes])

  // Filter QR codes based on search, status, batch, and user (lifecycle-based)
  const filteredQRCodes = useMemo(() => {
    let result = qrCodes

    // Apply batch filter
    if (qrBatchFilter !== 'all') {
      result = result.filter(qr => qr.batch_id === qrBatchFilter)
    }

    // Apply user filter
    if (qrUserFilter !== 'all') {
      result = result.filter(qr => qr.user_email === qrUserFilter)
    }

    // Apply status filter based on lifecycle phases
    if (qrStatusFilter === 'inactive') {
      // Available: allocated to tenant but not activated by user
      result = result.filter(qr => qr.status === 'INACTIVE')
    } else if (qrStatusFilter === 'active') {
      // Activated: user has activated (with or without pet)
      result = result.filter(qr => qr.status === 'ACTIVE')
    } else if (qrStatusFilter === 'linked') {
      // In Use: has pet_id set
      result = result.filter(qr => qr.pet_id !== undefined && qr.pet_id !== null)
    }

    return result
  }, [qrCodes, qrStatusFilter, qrBatchFilter, qrUserFilter])

  // QR pagination calculations
  const qrTotalPages = Math.ceil(filteredQRCodes.length / qrPerPage)
  const qrStartIndex = (qrCurrentPage - 1) * qrPerPage
  const qrEndIndex = qrStartIndex + qrPerPage
  const paginatedQRCodes = filteredQRCodes.slice(qrStartIndex, qrEndIndex)

  // QR stats calculations based on lifecycle
  // - Total: All QR codes allocated to this tenant
  // - Available: Ready to sell (status = 'inactive')
  // - Activated: User has activated (status = 'active')
  // - In Use: Linked to a pet (pet_id is set)
  const qrStats = useMemo(() => {
    const total = tenantStats?.total_qr_codes ?? qrCodes.length
    const available = qrCodes.filter(qr => qr.status === 'INACTIVE').length
    const activated = qrCodes.filter(qr => qr.status === 'ACTIVE').length
    const inUse = qrCodes.filter(qr => qr.pet_id !== undefined && qr.pet_id !== null).length
    return { total, available, activated, inUse }
  }, [qrCodes, tenantStats])

  // Reset QR page when filters change
  useEffect(() => {
    setQRCurrentPage(1)
  }, [qrSearchQuery, qrStatusFilter, qrBatchFilter, qrUserFilter])

  // Pets pagination calculations
  const petsTotalPages = Math.ceil(filteredPets.length / petsPerPage)
  const petsStartIndex = (petsCurrentPage - 1) * petsPerPage
  const petsEndIndex = petsStartIndex + petsPerPage
  const paginatedPets = filteredPets.slice(petsStartIndex, petsEndIndex)

  // Reset pets page when filters change
  useEffect(() => {
    setPetsCurrentPage(1)
  }, [petsSearchQuery, petsSpeciesFilter, petsUserFilter])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'pets' as const, label: 'Pets', icon: PawPrint },
    { id: 'qrcodes' as const, label: 'QR Codes', icon: QrCode },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'support' as const, label: 'Support', icon: HelpCircle },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  // Handler for impersonating a user
  const handleImpersonateUser = (user: TenantUser) => {
    // TODO: Implement actual impersonation logic
    console.log('Impersonating user:', user.email)
    alert(`Impersonation of ${user.email} would start here. This action will be logged.`)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading store statistics...</p>
                </div>
              </div>
            )}

            {/* Store Stats & Quick Actions Combined */}
            {!isLoading && tenantStats && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setUserStatusFilter('all')
                    setActiveTab('users')
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_users}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserStatusFilter('active')
                      setActiveTab('users')
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-0.5 sm:mt-1"
                  >
                    {tenantStats.active_users} active →
                  </button>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to manage users →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('pets')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Pets</h3>
                    <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_pets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Registered in your store</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view pets →
                  </p>
                </button>

                <button
                  onClick={() => {
                    setQRStatusFilter('all')
                    setActiveTab('qrcodes')
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">QR Codes</h3>
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_qr_codes}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setQRStatusFilter('active')
                      setActiveTab('qrcodes')
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 sm:mt-1"
                  >
                    {tenantStats.active_qr_codes} active →
                  </button>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view inventory →
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all text-left group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{tenantStats.total_scans}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">From your store</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    Click to view analytics →
                  </p>
                </button>
              </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Recent Activity (24h)
                </h3>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                >
                  view more →
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Placeholder activity items - will be replaced with real data */}
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                    <UserPlus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">New user registered</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Just now</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
                    <PawPrint className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">Pet "Buddy" registered</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">5 min ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-purple-100 dark:bg-purple-900/30">
                    <QrCode className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR code activated for "Max"</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">15 min ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30">
                    <Scan className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR scanned for "Luna" from San Francisco</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">1 hour ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30">
                    <Scan className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">QR scanned for "Buddy" from New York</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'users':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage customers in your store
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setUsersViewMode('grid')}
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
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
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      usersViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                {/* Select Mode Toggle */}
                <button
                  onClick={handleToggleUserSelectMode}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm min-h-[44px] ${
                    isUserSelectMode
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">{isUserSelectMode ? 'Cancel' : 'Select'}</span>
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>

            {/* Search Bar with User Count */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </div>
            </div>

            {/* Active Search Filter Tag */}
            {userSearchQuery && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  Search: "{userSearchQuery}"
                  <button
                    onClick={() => setUserSearchQuery('')}
                    className="hover:text-purple-900 dark:hover:text-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Selection Action Bar */}
            {isUserSelectMode && (
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {selectedUserIds.size} of {filteredUsers.length} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllUsers}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={handleDeselectAllUsers}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={selectedUserIds.size === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedUserIds.size === 0
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedUserIds.size})
                </button>
              </div>
            )}

            {/* Users Grid/List */}
            {isUsersLoading ? (
              usersViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TenantUserCardSkeleton />
                  <TenantUserCardSkeleton />
                  <TenantUserCardSkeleton />
                  <TenantUserCardSkeleton />
                  <TenantUserCardSkeleton />
                  <TenantUserCardSkeleton />
                </div>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              )
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {userSearchQuery ? 'No Users Found' : 'No Users Yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {userSearchQuery
                    ? 'Try adjusting your search'
                    : 'Click "Add User" to create the first user in your store'}
                </p>
                {!userSearchQuery && (
                  <button
                    onClick={handleCreateUser}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add User
                  </button>
                )}
              </div>
            ) : usersViewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedUsers.map((user) => (
                  <div key={user.id} className="relative">
                    {isUserSelectMode && (
                      <button
                        onClick={() => handleToggleUserSelection(user.id)}
                        className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          selectedUserIds.has(user.id)
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                        }`}
                      >
                        {selectedUserIds.has(user.id) && (
                          <CheckSquare className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <div
                      className={`${
                        isUserSelectMode && selectedUserIds.has(user.id)
                          ? 'ring-2 ring-purple-500 rounded-xl'
                          : ''
                      }`}
                      onClick={isUserSelectMode ? () => handleToggleUserSelection(user.id) : undefined}
                    >
                      <TenantUserCard
                        user={user}
                        onEdit={isUserSelectMode ? undefined : handleEditUser}
                        onDelete={isUserSelectMode ? undefined : handleDeleteUser}
                        onResetPassword={isUserSelectMode ? undefined : handleResetPassword}
                        onImpersonate={isUserSelectMode ? undefined : handleImpersonateUser}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[320px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      {isUserSelectMode && (
                        <th className="py-2 sm:py-3 px-2 sm:px-4 w-10">
                          <input
                            type="checkbox"
                            checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length}
                            onChange={handleSelectAllUsers}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </th>
                      )}
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Pets</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">QR Codes</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Created</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          isUserSelectMode && selectedUserIds.has(user.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                        }`}
                      >
                        {isUserSelectMode && (
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(user.id)}
                              onChange={() => handleToggleUserSelection(user.id)}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </td>
                        )}
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{user.email}</p>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <PawPrint className="w-3 h-3 mr-1" />
                            {user.pet_count ?? 0}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <QrCode className="w-3 h-3 mr-1" />
                            {user.qr_count ?? 0}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleImpersonateUser(user)}
                              className="p-1.5 sm:p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title={`Impersonate ${user.email}`}
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title={`Edit ${user.email}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
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

            {/* User Count Summary */}
            {!isUsersLoading && filteredUsers.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {usersStartIndex + 1}-{Math.min(usersEndIndex, filteredUsers.length)} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'pets':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">All Pets</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pets registered by your store's customers
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setPetsViewMode('grid')}
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      petsViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setPetsViewMode('list')}
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      petsViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pet Stats - Clickable for filtering */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <button
                onClick={() => setPetsSpeciesFilter('all')}
                className={`bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  petsSpeciesFilter === 'all'
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{allPets.length}</p>
              </button>
              <button
                onClick={() => setPetsSpeciesFilter('dog')}
                className={`bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  petsSpeciesFilter === 'dog'
                    ? 'border-amber-500 ring-2 ring-amber-500/50'
                    : 'border-amber-200 dark:border-amber-800 hover:border-amber-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Dogs</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {allPets.filter(p => p.pet_type?.toLowerCase() === 'dog').length}
                </p>
              </button>
              <button
                onClick={() => setPetsSpeciesFilter('cat')}
                className={`bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  petsSpeciesFilter === 'cat'
                    ? 'border-purple-500 ring-2 ring-purple-500/50'
                    : 'border-purple-200 dark:border-purple-800 hover:border-purple-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cats</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {allPets.filter(p => p.pet_type?.toLowerCase() === 'cat').length}
                </p>
              </button>
              <button
                onClick={() => setPetsSpeciesFilter('other')}
                className={`bg-gray-50 dark:bg-gray-700/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  petsSpeciesFilter === 'other'
                    ? 'border-gray-500 ring-2 ring-gray-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Other</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {allPets.filter(p => !['dog', 'cat'].includes(p.pet_type?.toLowerCase() || '')).length}
                </p>
              </button>
            </div>

            {/* Search and User Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by pet name or owner email..."
                  value={petsSearchQuery}
                  onChange={(e) => setPetsSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* User Filter */}
              {petsUserEmails.length > 0 && (
                <div className="sm:w-44">
                  <SearchableSelect
                    value={petsUserFilter}
                    onChange={setPetsUserFilter}
                    options={petsUserEmails}
                    placeholder="Search owner..."
                    allOptionLabel="All Owners"
                  />
                </div>
              )}
            </div>

            {/* Active Filters Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredPets.length} of {allPets.length} pets
                </span>
                {petsSearchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Search: "{petsSearchQuery}"
                    <button onClick={() => setPetsSearchQuery('')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {petsSpeciesFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Type: {petsSpeciesFilter.charAt(0).toUpperCase() + petsSpeciesFilter.slice(1)}
                    <button onClick={() => setPetsSpeciesFilter('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {petsUserFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Owner: {petsUserFilter}
                    <button onClick={() => setPetsUserFilter('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setPetsSearchQuery('')
                      setPetsSpeciesFilter('all')
                      setPetsUserFilter('all')
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Pets Grid/List */}
            {isPetsLoading ? (
              <div className={petsViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'space-y-2'}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={petsViewMode === 'grid' ? 'h-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' : 'h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse'} />
                ))}
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
                <PawPrint className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all' ? 'No Pets Found' : 'No Pets Yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {petsSearchQuery || petsSpeciesFilter !== 'all' || petsUserFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Pets registered by your store\'s customers will appear here.'}
                </p>
              </div>
            ) : petsViewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {paginatedPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
                  >
                    {/* Status Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                        pet.pet_type?.toLowerCase() === 'dog'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : pet.pet_type?.toLowerCase() === 'cat'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {pet.pet_type || 'Other'}
                      </span>
                      {/* QR Binding Status */}
                      {pet.qr_code_id ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <QrCode className="w-3 h-3 mr-0.5" />
                          Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          No QR
                        </span>
                      )}
                    </div>

                    {/* Pet Photo/Icon */}
                    <div className="text-center mb-2">
                      {pet.profile_photo_url ? (
                        <img
                          src={pet.profile_photo_url}
                          alt={pet.name}
                          className="w-12 h-12 rounded-full object-cover mx-auto mb-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1">
                          {pet.pet_type?.toLowerCase() === 'dog' ? (
                            <Dog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          ) : pet.pet_type?.toLowerCase() === 'cat' ? (
                            <Cat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <PawPrint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      )}
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{pet.name}</p>
                      {pet.breed && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{pet.breed}</p>
                      )}
                      {/* Gender & Color */}
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {pet.gender && pet.gender !== 'unknown' && (
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 capitalize">{pet.gender}</span>
                        )}
                        {pet.gender && pet.gender !== 'unknown' && pet.color && (
                          <span className="text-[9px] text-gray-300 dark:text-gray-600">•</span>
                        )}
                        {pet.color && (
                          <span className="text-[9px] text-gray-400 dark:text-gray-500">{pet.color}</span>
                        )}
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={pet.owner_email}>{pet.owner_email}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        title="View Details"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button
                        title="Edit Pet"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[320px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Pet</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Type</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Breed</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Owner</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">QR</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Created</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPets.map((pet) => (
                      <tr key={pet.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {pet.profile_photo_url ? (
                              <img
                                src={pet.profile_photo_url}
                                alt={pet.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                {pet.pet_type?.toLowerCase() === 'dog' ? (
                                  <Dog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                ) : pet.pet_type?.toLowerCase() === 'cat' ? (
                                  <Cat className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{pet.name}</p>
                              {pet.color && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{pet.color}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                            pet.pet_type?.toLowerCase() === 'dog'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : pet.pet_type?.toLowerCase() === 'cat'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {pet.pet_type || 'Other'}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {pet.breed || '-'}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px] block">
                            {pet.owner_email}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                          {pet.qr_code_id ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <QrCode className="w-3 h-3 mr-1" />
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              No QR
                            </span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {new Date(pet.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="View Details"
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              title="Edit Pet"
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {petsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 py-3">
                <button
                  onClick={() => setPetsCurrentPage(1)}
                  disabled={petsCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setPetsCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={petsCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {petsCurrentPage} of {petsTotalPages}
                </span>
                <button
                  onClick={() => setPetsCurrentPage(prev => Math.min(petsTotalPages, prev + 1))}
                  disabled={petsCurrentPage === petsTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setPetsCurrentPage(petsTotalPages)}
                  disabled={petsCurrentPage === petsTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Pet Count Summary */}
            {!isPetsLoading && filteredPets.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {petsStartIndex + 1}-{Math.min(petsEndIndex, filteredPets.length)} of {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'qrcodes':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">QR Code Inventory</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage QR codes assigned to your store
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setQRViewMode('grid')}
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      qrViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setQRViewMode('list')}
                    className={`p-2.5 sm:p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      qrViewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* QR Stats - Based on Lifecycle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <button
                onClick={() => setQRStatusFilter('all')}
                className={`bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  qrStatusFilter === 'all'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                    : 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{qrStats.total}</p>
              </button>
              <button
                onClick={() => setQRStatusFilter('inactive')}
                className={`bg-gray-50 dark:bg-gray-700/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  qrStatusFilter === 'inactive'
                    ? 'border-gray-500 ring-2 ring-gray-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{qrStats.available}</p>
              </button>
              <button
                onClick={() => setQRStatusFilter('active')}
                className={`bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  qrStatusFilter === 'active'
                    ? 'border-green-500 ring-2 ring-green-500/50'
                    : 'border-green-200 dark:border-green-800 hover:border-green-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Activated</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{qrStats.activated}</p>
              </button>
              <button
                onClick={() => setQRStatusFilter('linked')}
                className={`bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border transition-all text-left ${
                  qrStatusFilter === 'linked'
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
                }`}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Use</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{qrStats.inUse}</p>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by QR code or user email..."
                  value={qrSearchQuery}
                  onChange={(e) => setQRSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Batch Filter */}
              {availableBatches.length > 0 && (
                <div className="sm:w-40">
                  <SearchableSelect
                    value={qrBatchFilter}
                    onChange={setQRBatchFilter}
                    options={availableBatches}
                    placeholder="Search batch..."
                    allOptionLabel="All Batches"
                  />
                </div>
              )}

              {/* User Filter */}
              {qrUserEmails.length > 0 && (
                <div className="sm:w-44">
                  <SearchableSelect
                    value={qrUserFilter}
                    onChange={setQRUserFilter}
                    options={qrUserEmails}
                    placeholder="Search user..."
                    allOptionLabel="All Users"
                  />
                </div>
              )}
            </div>

            {/* Active Filters Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredQRCodes.length} of {qrStats.total} QR codes
                </span>
                {qrSearchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Search: "{qrSearchQuery}"
                    <button onClick={() => setQRSearchQuery('')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {qrStatusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Status: {qrStatusFilter === 'inactive' ? 'Available' : qrStatusFilter === 'active' ? 'Activated' : 'In Use'}
                    <button onClick={() => setQRStatusFilter('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {qrBatchFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    Batch: {qrBatchFilter}
                    <button onClick={() => setQRBatchFilter('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {qrUserFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    User: {qrUserFilter}
                    <button onClick={() => setQRUserFilter('all')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setQRSearchQuery('')
                      setQRStatusFilter('all')
                      setQRBatchFilter('all')
                      setQRUserFilter('all')
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* QR Codes Grid/List */}
            {isQRCodesLoading ? (
              <div className={qrViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'space-y-2'}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={qrViewMode === 'grid' ? 'h-40 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse' : 'h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse'} />
                ))}
              </div>
            ) : filteredQRCodes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-gray-200 dark:border-gray-700 text-center">
                <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all' ? 'No QR Codes Found' : 'No QR Codes Yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {qrSearchQuery || qrStatusFilter !== 'all' || qrBatchFilter !== 'all' || qrUserFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Contact support to request QR codes for your store'}
                </p>
              </div>
            ) : qrViewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {paginatedQRCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        qr.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : qr.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {qr.status}
                      </span>
                      {qr.pet_id && <PawPrint className="w-3 h-3 text-blue-500" />}
                    </div>

                    {/* QR Code Info */}
                    <div className="text-center mb-2">
                      <QrCode className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto mb-1" />
                      <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white truncate">{qr.code}</p>
                      <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400">PIN: {qr.pin}</p>
                    </div>

                    {/* Pet/User Info */}
                    <div className="text-center mb-2 min-h-[32px]">
                      {qr.pet_name ? (
                        <p className="text-xs text-gray-900 dark:text-white truncate">{qr.pet_name}</p>
                      ) : qr.user_email ? (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{qr.user_email}</p>
                      ) : (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Unassigned</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleViewQR(qr)}
                        className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadQR(qr)}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {qr.pet_id ? (
                        <button
                          onClick={() => handleUnlinkFromPet(qr)}
                          className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors"
                          title="Unlink"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkToPet(qr)}
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                          title="Link to Pet"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[320px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">QR Code</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">PIN</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">User</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Linked Pet</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Created</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedQRCodes.map((qr) => (
                      <tr key={qr.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            <span className="font-mono text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{qr.code}</span>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <span className="font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">{qr.pin}</span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            qr.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : qr.status === 'INACTIVE'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          {qr.user_email ? (
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[150px] block">{qr.user_email}</span>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          {qr.pet_name ? (
                            <div className="flex items-center gap-1">
                              <PawPrint className="w-3 h-3 text-blue-500" />
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{qr.pet_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Not linked</span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {new Date(qr.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => handleViewQR(qr)}
                              className="p-1.5 sm:p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadQR(qr)}
                              className="p-1.5 sm:p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Download QR Code"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {qr.pet_id ? (
                              <button
                                onClick={() => handleUnlinkFromPet(qr)}
                                className="p-1.5 sm:p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="Unlink from Pet"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLinkToPet(qr)}
                                className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="Link to Pet"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {qrTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 py-3">
                <button
                  onClick={() => setQRCurrentPage(1)}
                  disabled={qrCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setQRCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={qrCurrentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {qrCurrentPage} of {qrTotalPages}
                </span>
                <button
                  onClick={() => setQRCurrentPage(prev => Math.min(qrTotalPages, prev + 1))}
                  disabled={qrCurrentPage === qrTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setQRCurrentPage(qrTotalPages)}
                  disabled={qrCurrentPage === qrTotalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* QR Count Summary */}
            {!isQRCodesLoading && filteredQRCodes.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {qrStartIndex + 1}-{Math.min(qrEndIndex, filteredQRCodes.length)} of {filteredQRCodes.length} QR code{filteredQRCodes.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )

      case 'analytics':
        return <AnalyticsTab />

      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Store Settings</h2>

            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  placeholder="My Pet Store"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="mystore"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400">.petqr.app</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branding Color
                </label>
                <input
                  type="color"
                  defaultValue="#8B5CF6"
                  className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>

              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        )

      case 'support':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Support Tickets</h2>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                + New Ticket
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm">
                All
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                Open
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                In Progress
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm">
                Closed
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No support tickets. Create a new ticket if you need help.
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
      <div className="bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-700">
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
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
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
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500'
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

      {/* User Modals */}
      <AddTenantUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={handleUserSuccess}
      />

      <EditTenantUserModal
        isOpen={isEditUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      <DeleteTenantUserModal
        isOpen={isDeleteUserModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsDeleteUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      <ResetTenantUserPasswordModal
        isOpen={isResetPasswordModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsResetPasswordModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleUserSuccess}
      />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete {selectedUserIds.size} User{selectedUserIds.size !== 1 ? 's' : ''}?
                </h3>
              </div>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All selected users and their associated data will be permanently deleted.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modals */}
      <ViewTenantQRModal
        isOpen={isViewQRModalOpen}
        qr={selectedQR}
        onClose={() => {
          setIsViewQRModalOpen(false)
          setSelectedQR(null)
        }}
      />

      <LinkToPetModal
        isOpen={isLinkPetModalOpen}
        qr={selectedQR}
        onClose={() => {
          setIsLinkPetModalOpen(false)
          setSelectedQR(null)
        }}
        onSuccess={handleQRSuccess}
      />
    </div>
  )
}

export default TenantAdminDashboard
