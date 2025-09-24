/**
 * Language management hook.
 */

import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, LanguageOption } from '@/types'

interface LanguageStore {
  language: Language
  hasSelectedLanguage: boolean
  setLanguage: (language: Language) => void
  clearLanguagePreference: () => void
  t: (key: string, fallback?: string) => string
}

// Available languages
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',

    // Language Selection
    'language.title': 'Select Your Language',
    'language.subtitle': 'Choose your preferred language',

    // PIN Verification
    'pin.title': 'Enter Security Code',
    'pin.description': 'Please enter the 4-digit code from the pet tag',
    'pin.verify': 'Verify',
    'pin.error': 'Invalid PIN code',

    // Pet Display
    'pet.profile': 'Pet Profile',
    'pet.contact_owner': 'Contact Owner',
    'pet.send_location': 'Send Location',
    'pet.call_owner': 'Call Owner',
    'pet.buy_tag': 'Buy Tag',
    'petNotFound': 'Pet information not found',
    'networkError': 'Network error. Please try again.',

    // Auth
    'auth.title': 'Welcome to PetID',
    'auth.subtitle': 'Join the Pet Protection Community',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.forgot_password': 'Forgot Password?',
    'auth.login_success': 'Login successful',
    'auth.login_button': 'Sign In',
    'auth.register_button': 'Create Account',
    'auth.loading': 'Please wait...',
    'auth.email_placeholder': 'Enter your email address',
    'auth.password_placeholder': 'Enter your password',
    'auth.confirm_password_placeholder': 'Confirm your password',
    'auth.name_placeholder': 'Enter your full name',
    'auth.or_continue_with': 'Or continue with',
    'auth.google': 'Google',
    'auth.facebook': 'Facebook',
    'auth.apple': 'Apple',
    'auth.verification': 'I\'m not a robot',
    'auth.error.email_required': 'Email is required',
    'auth.error.invalid_email': 'Please enter a valid email',
    'auth.error.password_required': 'Password is required',
    'auth.error.password_min_length': 'Password must be at least 6 characters',
    'auth.error.name_required': 'Name is required',
    'auth.error.passwords_not_match': 'Passwords do not match',
    'auth.error.invalid_credentials': 'Invalid email or password',
    'auth.error.user_exists': 'User already exists with this email',
    'auth.error.verification_failed': 'Please complete the verification',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.stats': 'Statistics',
    'dashboard.qr_codes': 'QR Codes',
    'dashboard.pets': 'Pets',
    'dashboard.scans': 'Scans',

    // Common actions
    'verify': 'Verify',
    'verifying': 'Verifying...',
    'tryAgain': 'Try Again',
    'qrCodeId': 'QR Code',

    // QR Code Validation
    'qr.checking': 'Checking QR Code',
    'qr.checkingDescription': 'Please wait while we verify this QR code...',
    'qr.activated': 'QR Code Activated',
    'qr.activatedDescription': 'This QR code is registered to a pet. Redirecting to PIN verification...',
    'qr.notFound': 'QR Code Not Found',
    'qr.notFoundDescription': 'This QR code is not recognized. Please contact your dealer or pet store for assistance.',
    'qr.error': 'Connection Error',
    'qr.errorDescription': 'Unable to connect to our servers. Please check your internet connection and try again.',
    'qr.needsRegistration': 'Registration Required',
    'qr.needsRegistrationDescription': 'This QR code is valid but needs to be registered to your pet. Please create an account to get started.',
    'qr.register': 'Register This QR Code',
    'qr.notActivated': 'QR Code Not Activated',
    'qr.notActivatedDescription': 'This QR code has not been activated yet. Please contact your dealer or pet store to activate it before use.',
    'qr.contactDealer': 'Contact Dealer',
    'qr.contactDealerInfo': 'Please contact your dealer or pet store for assistance with this QR code.',

    // Landing Page
    'landing.tagline': 'Smart Pet Protection',
    'landing.title': 'Never lose your beloved pet again',
    'landing.features.qr': 'Instant QR code identification',
    'landing.features.gps': 'GPS location sharing',
    'landing.features.emergency': 'Emergency contacts',
    'landing.button.tryDemo': 'Try Demo',
    'landing.button.scanQR': 'Scan QR',
    'landing.button.login': 'Login',
    'landing.button.dashboard': 'Dashboard',
    'landing.feature.instant': 'Instant',
    'landing.feature.secure': 'Secure',
    'landing.feature.global': 'Global',
    'landing.footer': '© 2024 PetID. All rights reserved.',
  },
  zh: {
    // Common
    'common.loading': '加载中...',
    'common.error': '发生错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.back': '返回',
    'common.next': '下一步',
    'common.previous': '上一步',

    // Language Selection
    'language.title': '选择您的语言',
    'language.subtitle': '请选择您的首选语言',

    // PIN Verification
    'pin.title': '输入安全码',
    'pin.description': '请输入宠物标签上的4位数字代码',
    'pin.verify': '验证',
    'pin.error': '无效的PIN码',

    // Pet Display
    'pet.profile': '宠物档案',
    'pet.contact_owner': '联系主人',
    'pet.send_location': '发送位置',
    'pet.call_owner': '致电主人',
    'pet.buy_tag': '购买标签',
    'petNotFound': '找不到宠物信息',
    'networkError': '网络错误，请重试。',

    // Auth
    'auth.title': '欢迎来到PetID',
    'auth.subtitle': '加入宠物保护社区',
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.email': '电子邮箱',
    'auth.password': '密码',
    'auth.confirm_password': '确认密码',
    'auth.forgot_password': '忘记密码？',
    'auth.login_success': '登录成功',
    'auth.login_button': '登录',
    'auth.register_button': '创建账户',
    'auth.loading': '请稍候...',
    'auth.email_placeholder': '请输入您的邮箱地址',
    'auth.password_placeholder': '请输入您的密码',
    'auth.confirm_password_placeholder': '请确认您的密码',
    'auth.name_placeholder': '请输入您的姓名',
    'auth.or_continue_with': '或者使用以下方式继续',
    'auth.google': '谷歌',
    'auth.facebook': '脸书',
    'auth.apple': '苹果',
    'auth.verification': '我不是机器人',
    'auth.error.email_required': '邮箱地址必填',
    'auth.error.invalid_email': '请输入有效的邮箱地址',
    'auth.error.password_required': '密码必填',
    'auth.error.password_min_length': '密码至少需要6个字符',
    'auth.error.name_required': '姓名必填',
    'auth.error.passwords_not_match': '两次密码输入不匹配',
    'auth.error.invalid_credentials': '邮箱或密码错误',
    'auth.error.user_exists': '该邮箱已注册',
    'auth.error.verification_failed': '请完成验证',

    // Dashboard
    'dashboard.title': '仪表板',
    'dashboard.stats': '统计数据',
    'dashboard.qr_codes': '二维码',
    'dashboard.pets': '宠物',
    'dashboard.scans': '扫描',

    // Common actions
    'verify': '验证',
    'verifying': '验证中...',
    'tryAgain': '重试',
    'qrCodeId': '二维码',

    // QR Code Validation
    'qr.checking': '正在验证二维码',
    'qr.checkingDescription': '请稍候，我们正在验证此二维码...',
    'qr.activated': '二维码已激活',
    'qr.activatedDescription': '此二维码已注册到宠物，正在跳转到PIN验证...',
    'qr.notFound': '二维码未找到',
    'qr.notFoundDescription': '无法识别此二维码，请联系您的经销商或宠物店寻求帮助。',
    'qr.error': '连接错误',
    'qr.errorDescription': '无法连接到服务器，请检查网络连接后重试。',
    'qr.needsRegistration': '需要注册',
    'qr.needsRegistrationDescription': '此二维码有效但需要注册到您的宠物，请创建账户开始使用。',
    'qr.register': '注册此二维码',
    'qr.notActivated': '二维码未激活',
    'qr.notActivatedDescription': '此二维码尚未激活，请联系您的经销商或宠物店激活后再使用。',
    'qr.contactDealer': '联系经销商',
    'qr.contactDealerInfo': '请联系您的经销商或宠物店以获取此二维码的帮助。',

    // Landing Page
    'landing.tagline': '智能宠物保护',
    'landing.title': '再也不会丢失您心爱的宠物',
    'landing.features.qr': '即时二维码识别',
    'landing.features.gps': 'GPS位置分享',
    'landing.features.emergency': '紧急联系方式',
    'landing.button.tryDemo': '试用演示',
    'landing.button.scanQR': '扫描二维码',
    'landing.button.login': '登录',
    'landing.button.dashboard': '仪表板',
    'landing.feature.instant': '即时',
    'landing.feature.secure': '安全',
    'landing.feature.global': '全球',
    'landing.footer': '© 2024 PetID. 保留所有权利。',
  },
  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',

    // Language Selection
    'language.title': 'Selecciona tu idioma',
    'language.subtitle': 'Elige tu idioma preferido',

    // PIN Verification
    'pin.title': 'Ingresa el código de seguridad',
    'pin.description': 'Por favor ingresa el código de 4 dígitos de la etiqueta',
    'pin.verify': 'Verificar',
    'pin.error': 'Código PIN inválido',

    // Pet Display
    'pet.profile': 'Perfil de mascota',
    'pet.contact_owner': 'Contactar dueño',
    'pet.send_location': 'Enviar ubicación',
    'pet.call_owner': 'Llamar dueño',
    'pet.buy_tag': 'Comprar etiqueta',
    'petNotFound': 'Información de mascota no encontrada',
    'networkError': 'Error de red. Inténtalo de nuevo.',

    // Auth
    'auth.title': 'Bienvenido a PetID',
    'auth.subtitle': 'Únete a la Comunidad de Protección de Mascotas',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Registrarse',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirm_password': 'Confirmar Contraseña',
    'auth.forgot_password': '¿Olvidaste tu contraseña?',
    'auth.login_success': 'Inicio de sesión exitoso',
    'auth.login_button': 'Iniciar Sesión',
    'auth.register_button': 'Crear Cuenta',
    'auth.loading': 'Por favor espere...',
    'auth.email_placeholder': 'Ingresa tu correo electrónico',
    'auth.password_placeholder': 'Ingresa tu contraseña',
    'auth.confirm_password_placeholder': 'Confirma tu contraseña',
    'auth.name_placeholder': 'Ingresa tu nombre completo',
    'auth.or_continue_with': 'O continúa con',
    'auth.google': 'Google',
    'auth.facebook': 'Facebook',
    'auth.apple': 'Apple',
    'auth.verification': 'No soy un robot',
    'auth.error.email_required': 'El correo electrónico es obligatorio',
    'auth.error.invalid_email': 'Por favor ingresa un correo válido',
    'auth.error.password_required': 'La contraseña es obligatoria',
    'auth.error.password_min_length': 'La contraseña debe tener al menos 6 caracteres',
    'auth.error.name_required': 'El nombre es obligatorio',
    'auth.error.passwords_not_match': 'Las contraseñas no coinciden',
    'auth.error.invalid_credentials': 'Correo o contraseña incorrectos',
    'auth.error.user_exists': 'Ya existe un usuario con este correo',
    'auth.error.verification_failed': 'Por favor completa la verificación',

    // Dashboard
    'dashboard.title': 'Panel de control',
    'dashboard.stats': 'Estadísticas',
    'dashboard.qr_codes': 'Códigos QR',
    'dashboard.pets': 'Mascotas',
    'dashboard.scans': 'Escaneos',

    // Common actions
    'verify': 'Verificar',
    'verifying': 'Verificando...',
    'tryAgain': 'Intentar de nuevo',
    'qrCodeId': 'Código QR',

    // QR Code Validation
    'qr.checking': 'Verificando Código QR',
    'qr.checkingDescription': 'Por favor espere mientras verificamos este código QR...',
    'qr.activated': 'Código QR Activado',
    'qr.activatedDescription': 'Este código QR está registrado a una mascota. Redirigiendo a la verificación PIN...',
    'qr.notFound': 'Código QR No Encontrado',
    'qr.notFoundDescription': 'Este código QR no es reconocido. Por favor contacte a su distribuidor o tienda de mascotas para asistencia.',
    'qr.error': 'Error de Conexión',
    'qr.errorDescription': 'No se puede conectar a nuestros servidores. Por favor verifique su conexión a internet e intente de nuevo.',
    'qr.needsRegistration': 'Registro Requerido',
    'qr.needsRegistrationDescription': 'Este código QR es válido pero necesita ser registrado a su mascota. Por favor cree una cuenta para comenzar.',
    'qr.register': 'Registrar Este Código QR',
    'qr.notActivated': 'Código QR No Activado',
    'qr.notActivatedDescription': 'Este código QR aún no ha sido activado. Por favor contacte a su distribuidor o tienda de mascotas para activarlo antes de usarlo.',
    'qr.contactDealer': 'Contactar Distribuidor',
    'qr.contactDealerInfo': 'Por favor contacte a su distribuidor o tienda de mascotas para asistencia con este código QR.',

    // Landing Page
    'landing.tagline': 'Protección Inteligente para Mascotas',
    'landing.title': 'Nunca más pierdas a tu querida mascota',
    'landing.features.qr': 'Identificación instantánea con código QR',
    'landing.features.gps': 'Compartir ubicación GPS',
    'landing.features.emergency': 'Contactos de emergencia',
    'landing.button.tryDemo': 'Probar Demo',
    'landing.button.scanQR': 'Escanear QR',
    'landing.button.login': 'Iniciar Sesión',
    'landing.button.dashboard': 'Panel de Control',
    'landing.feature.instant': 'Instantáneo',
    'landing.feature.secure': 'Seguro',
    'landing.feature.global': 'Global',
    'landing.footer': '© 2024 PetID. Todos los derechos reservados.',
  },
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',

    // Language Selection
    'language.title': 'Sélectionnez votre langue',
    'language.subtitle': 'Choisissez votre langue préférée',

    // PIN Verification
    'pin.title': 'Entrez le code de sécurité',
    'pin.description': 'Veuillez entrer le code à 4 chiffres de l\'étiquette',
    'pin.verify': 'Vérifier',
    'pin.error': 'Code PIN invalide',

    // Pet Display
    'pet.profile': 'Profil de l\'animal',
    'pet.contact_owner': 'Contacter le propriétaire',
    'pet.send_location': 'Envoyer la localisation',
    'pet.call_owner': 'Appeler le propriétaire',
    'pet.buy_tag': 'Acheter une étiquette',
    'petNotFound': 'Informations sur l\'animal non trouvées',
    'networkError': 'Erreur réseau. Veuillez réessayer.',

    // Auth
    'auth.login': 'Se connecter',
    'auth.register': 'S\'inscrire',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.forgot_password': 'Mot de passe oublié ?',
    'auth.login_success': 'Connexion réussie',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.stats': 'Statistiques',
    'dashboard.qr_codes': 'Codes QR',
    'dashboard.pets': 'Animaux',
    'dashboard.scans': 'Scans',

    // Common actions
    'verify': 'Vérifier',
    'verifying': 'Vérification...',
    'tryAgain': 'Réessayer',
    'qrCodeId': 'Code QR',

    // QR Code Validation
    'qr.checking': 'Vérification du Code QR',
    'qr.checkingDescription': 'Veuillez patienter pendant que nous vérifions ce code QR...',
    'qr.activated': 'Code QR Activé',
    'qr.activatedDescription': 'Ce code QR est enregistré pour un animal. Redirection vers la vérification PIN...',
    'qr.notFound': 'Code QR Non Trouvé',
    'qr.notFoundDescription': 'Ce code QR n\'est pas reconnu. Veuillez contacter votre revendeur ou animalerie pour assistance.',
    'qr.error': 'Erreur de Connexion',
    'qr.errorDescription': 'Impossible de se connecter à nos serveurs. Veuillez vérifier votre connexion internet et réessayer.',
    'qr.needsRegistration': 'Inscription Requise',
    'qr.needsRegistrationDescription': 'Ce code QR est valide mais doit être enregistré pour votre animal. Veuillez créer un compte pour commencer.',
    'qr.register': 'Enregistrer ce Code QR',
    'qr.notActivated': 'Code QR Non Activé',
    'qr.notActivatedDescription': 'Ce code QR n\'a pas encore été activé. Veuillez contacter votre revendeur ou animalerie pour l\'activer avant utilisation.',
    'qr.contactDealer': 'Contacter le Revendeur',
    'qr.contactDealerInfo': 'Veuillez contacter votre revendeur ou animalerie pour assistance avec ce code QR.',

    // Landing Page
    'landing.tagline': 'Protection Intelligente pour Animaux',
    'landing.title': 'Ne perdez plus jamais votre animal de compagnie bien-aimé',
    'landing.features.qr': 'Identification instantanée par code QR',
    'landing.features.gps': 'Partage de localisation GPS',
    'landing.features.emergency': 'Contacts d\'urgence',
    'landing.button.tryDemo': 'Essayer la Démo',
    'landing.button.scanQR': 'Scanner QR',
    'landing.button.login': 'Se Connecter',
    'landing.button.dashboard': 'Tableau de Bord',
    'landing.feature.instant': 'Instantané',
    'landing.feature.secure': 'Sécurisé',
    'landing.feature.global': 'Global',
    'landing.footer': '© 2024 PetID. Tous droits réservés.',
  },
}

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      hasSelectedLanguage: false,

      setLanguage: (language: Language) => {
        set({ language, hasSelectedLanguage: true })
        document.documentElement.setAttribute('lang', language)
      },

      clearLanguagePreference: () => {
        set({ language: 'en', hasSelectedLanguage: false })
        document.documentElement.setAttribute('lang', 'en')
      },

      t: (key: string, fallback?: string): string => {
        const { language } = get()
        return translations[language]?.[key] || fallback || key
      },
    }),
    {
      name: 'pet-qr-language',
    }
  )
)

export const useLanguage = () => {
  const { language, hasSelectedLanguage, setLanguage, clearLanguagePreference, t } = useLanguageStore()

  // Apply language on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('lang', language)
  }, [language])

  return {
    language,
    hasSelectedLanguage,
    setLanguage,
    clearLanguagePreference,
    t,
    languages: LANGUAGES,
  }
}