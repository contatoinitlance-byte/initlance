import React, { createContext, useState, useContext, useEffect } from 'react';
import supabase from '@/api/supabaseClient';
import { db, getBanState, isAdminEmail } from '@/api/supabaseData';

const AuthContext = createContext();
const ADMIN_SESSION_KEY = 'initlance_admin_session';
const ADMIN_EMAIL = 'pedrooInit@admin';

const normalizeUser = (user) => {
    if (!user) return null;
    const metadata = user.user_metadata || user.raw_user_meta_data || {};
    const role = metadata.role || user.role;
    return {
        ...user,
        full_name: user.full_name || metadata.full_name || metadata.name,
        avatar_url: user.avatar_url || metadata.avatar_url || metadata.picture,
        role,
    };
};

const mergeAuthUserWithProfile = (authUser, profile) => {
    const normalized = normalizeUser(authUser);
    if (!normalized) return null;

    return {
        ...(profile || {}),
        ...normalized,
        full_name: profile?.full_name || normalized.full_name,
        avatar_url: profile?.avatar_url || normalized.avatar_url,
        foto_perfil: profile?.foto_perfil || normalized.foto_perfil,
        bio: profile?.bio || normalized.bio,
        role: profile?.role || normalized.role || normalized.user_metadata?.role,
    };
};

const getLocalAdmin = () => {
    try {
        const stored = window.localStorage.getItem(ADMIN_SESSION_KEY);
        if (!stored) return null;
        const admin = JSON.parse(stored);
        return isAdminEmail(admin?.email) ? admin : null;
    } catch {
        return null;
    }
};

const getSafeProfile = async (authUser) => {
    try {
        const profile = await db.users.byId(authUser?.id).then((row) => row || db.users.byEmail(authUser?.email));
        return profile || await db.users.ensureCurrent(authUser);
    } catch (error) {
        console.warn('Profile lookup skipped:', error);
        return null;
    }
};

export const getRoleRedirectPath = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'freelancer') return '/dashboard';
    if (role === 'client') return '/client';
    return '/role-selection';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        let unsubscribe;

        const initAuth = async () => {
            const localAdmin = getLocalAdmin();
            if (localAdmin) {
                setUser(localAdmin);
                setIsAuthenticated(true);
                setIsLoadingAuth(false);
                setAuthChecked(true);
                return;
            }

            if (!supabase) {
                setAuthError({ type: 'supabase_config', message: 'Supabase não está configurado.' });
                setIsAuthenticated(false);
                setIsLoadingAuth(false);
                setAuthChecked(true);
                return;
            }

            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.warn('Supabase session check failed:', error);
                setAuthError({ type: 'supabase', message: error.message });
            }

            if (data?.session?.user) {
                const normalized = normalizeUser(data.session.user);
                const profile = await getSafeProfile(data.session.user);
                const ban = getBanState(profile);
                if (ban.banned) {
                    await supabase.auth.signOut();
                    setAuthError({
                        type: 'banned',
                        message: ban.permanent
                            ? 'Sua conta foi banida permanentemente.'
                            : `Sua conta esta suspensa ate ${ban.until?.toLocaleString('pt-BR') || 'nova analise'}.`,
                    });
                    setIsAuthenticated(false);
                    setUser(null);
                } else {
                    setUser(mergeAuthUserWithProfile(data.session.user, profile));
                    setIsAuthenticated(true);
                    setAuthError(null);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }

            setIsLoadingAuth(false);
            setAuthChecked(true);

            const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
                if (session?.user) {
                    setUser(normalizeUser(session.user));
                    setIsAuthenticated(true);
                    setAuthError(null);

                    window.setTimeout(async () => {
                        const profile = await getSafeProfile(session.user);
                        setUser(mergeAuthUserWithProfile(session.user, profile));
                    }, 0);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            });

            unsubscribe = subscription?.unsubscribe;
        };

        initAuth();

        return () => {
            unsubscribe?.();
        };
    }, []);

    const checkSupabaseSession = async () => {
        const localAdmin = getLocalAdmin();
        if (localAdmin) {
            setUser(localAdmin);
            setIsAuthenticated(true);
            setAuthError(null);
            return true;
        }

        if (!supabase) return false;
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.warn('Supabase session check error:', error);
            return false;
        }
        if (data?.session?.user) {
            const normalized = normalizeUser(data.session.user);
            const profile = await getSafeProfile(data.session.user);
            const ban = getBanState(profile);
            if (ban.banned) {
                await supabase.auth.signOut();
                setUser(null);
                setIsAuthenticated(false);
                setAuthError({
                    type: 'banned',
                    message: ban.permanent
                        ? 'Sua conta foi banida permanentemente.'
                        : `Sua conta esta suspensa ate ${ban.until?.toLocaleString('pt-BR') || 'nova analise'}.`,
                });
                return false;
            }
            setUser(mergeAuthUserWithProfile(data.session.user, profile));
            setIsAuthenticated(true);
            setAuthError(null);
            return true;
        }
        return false;
    };

    const updateUserRole = async (role) => {
        if (!supabase) {
            throw new Error('Supabase não está configurado.');
        }

        const currentMetadata = user?.user_metadata || user?.raw_user_meta_data || {};
        const { data, error } = await supabase.auth.updateUser({
            data: {
                ...currentMetadata,
                role,
            },
        });

        if (error) {
            throw error;
        }

        const normalizedUser = normalizeUser(data.user);
        setUser(normalizedUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return normalizedUser;
    };

    const getPostAuthRedirect = (authUser = user) => {
        return getRoleRedirectPath(normalizeUser(authUser)?.role);
    };

    const loginLocalAdmin = () => {
        const admin = {
            id: 'local-admin',
            email: ADMIN_EMAIL,
            full_name: 'Admin Initlance',
            role: 'admin',
            user_metadata: { role: 'admin', full_name: 'Admin Initlance' },
        };
        window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
        setUser(admin);
        setIsAuthenticated(true);
        setAuthError(null);
        return admin;
    };

    const logout = async (shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);
        window.localStorage.removeItem(ADMIN_SESSION_KEY);

        if (!supabase) {
            return;
        }

        await supabase.auth.signOut();

        if (shouldRedirect) {
            window.location.href = '/';
        }
    };

    const navigateToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            authChecked,
            logout,
            navigateToLogin,
            checkSupabaseSession,
            checkUserAuth: checkSupabaseSession,
            updateUserRole,
            getPostAuthRedirect,
            loginLocalAdmin,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
