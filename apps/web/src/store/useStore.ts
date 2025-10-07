import { create } from 'zustand';
import { tokenStorage } from '@/lib/auth-storage';
import { Domain, ModSecurityCRSRule, ModSecurityCustomRule, SSLCertificate, Alert, User, ACLRule, UserProfile } from '@/types';
import { mockDomains, mockSSLCerts, mockAlerts, mockUsers, mockACLRules } from '@/mocks/data';
import * as modsecService from '@/services/modsec.service';

interface StoreState {
  // Auth
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  // Domains
  domains: Domain[];
  addDomain: (domain: Omit<Domain, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateDomain: (id: string, updates: Partial<Domain>) => void;
  deleteDomain: (id: string) => void;

  // ModSecurity
  crsRules: ModSecurityCRSRule[];
  customRules: ModSecurityCustomRule[];
  loadCRSRules: () => Promise<void>;
  toggleCRSRule: (ruleFile: string) => Promise<void>;
  loadCustomRules: () => Promise<void>;
  toggleCustomRule: (id: string) => Promise<void>;
  addCustomRule: (rule: modsecService.CreateModSecRuleRequest) => Promise<void>;
  deleteCustomRule: (id: string) => Promise<void>;
  globalModSecEnabled: boolean;
  loadGlobalModSecSettings: () => Promise<void>;
  setGlobalModSec: (enabled: boolean) => Promise<void>;

  // SSL
  sslCerts: SSLCertificate[];
  addSSLCert: (cert: Omit<SSLCertificate, 'id'>) => void;
  deleteSSLCert: (id: string) => void;

  // Alerts
  alerts: Alert[];
  acknowledgeAlert: (id: string) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // ACL
  aclRules: ACLRule[];
  addACLRule: (rule: Omit<ACLRule, 'id'>) => void;
  updateACLRule: (id: string, updates: Partial<ACLRule>) => void;
  deleteACLRule: (id: string) => void;
  toggleACLRule: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  // Auth
  isAuthenticated: tokenStorage.isAuthenticated(),
  currentUser: tokenStorage.getUser(),
  setUser: (user) => {
    if (user) {
      tokenStorage.setUser(user);
    } else {
      tokenStorage.removeUser();
    }
    set({ isAuthenticated: !!user, currentUser: user });
    window.dispatchEvent(new CustomEvent('auth:change'));
  },
  logout: () => {
    tokenStorage.clearAuth();
    set({ isAuthenticated: false, currentUser: null });
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  // Domains
  domains: mockDomains,
  addDomain: (domain) => {
    const newDomain: Domain = {
      ...domain,
      id: `dom_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    set((state) => ({ domains: [...state.domains, newDomain] }));
  },
  updateDomain: (id, updates) => {
    set((state) => ({
      domains: state.domains.map((d) =>
        d.id === id ? { ...d, ...updates, lastModified: new Date().toISOString() } : d
      )
    }));
  },
  deleteDomain: (id) => {
    set((state) => ({ domains: state.domains.filter((d) => d.id !== id) }));
  },

  // ModSecurity
  crsRules: [],
  customRules: [],
  loadCRSRules: async () => {
    try {
      const rules = await modsecService.getCRSRules();
      set({ crsRules: rules });
    } catch (error) {
      console.error('Failed to load CRS rules:', error);
    }
  },
  toggleCRSRule: async (ruleFile) => {
    try {
      const updatedRule = await modsecService.toggleCRSRule(ruleFile);
      set((state) => ({
        crsRules: state.crsRules.map((r) =>
          r.ruleFile === ruleFile ? updatedRule : r
        )
      }));
    } catch (error) {
      console.error('Failed to toggle CRS rule:', error);
      throw error;
    }
  },
  loadCustomRules: async () => {
    try {
      const rules = await modsecService.getModSecRules();
      set({ customRules: rules });
    } catch (error) {
      console.error('Failed to load custom rules:', error);
    }
  },
  toggleCustomRule: async (id) => {
    try {
      const updatedRule = await modsecService.toggleModSecRule(id);
      set((state) => ({
        customRules: state.customRules.map((r) =>
          r.id === id ? updatedRule : r
        )
      }));
    } catch (error) {
      console.error('Failed to toggle custom rule:', error);
      throw error;
    }
  },
  addCustomRule: async (rule) => {
    try {
      const newRule = await modsecService.addCustomRule(rule);
      set((state) => ({
        customRules: [...state.customRules, newRule]
      }));
    } catch (error) {
      console.error('Failed to add custom rule:', error);
      throw error;
    }
  },
  deleteCustomRule: async (id) => {
    try {
      await modsecService.deleteModSecRule(id);
      set((state) => ({
        customRules: state.customRules.filter((r) => r.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete custom rule:', error);
      throw error;
    }
  },
  globalModSecEnabled: true,
  loadGlobalModSecSettings: async () => {
    try {
      const settings = await modsecService.getGlobalModSecSettings();
      set({ globalModSecEnabled: settings.enabled });
    } catch (error) {
      console.error('Failed to load global ModSecurity settings:', error);
    }
  },
  setGlobalModSec: async (enabled) => {
    try {
      await modsecService.setGlobalModSec(enabled);
      set({ globalModSecEnabled: enabled });
    } catch (error) {
      console.error('Failed to set global ModSecurity:', error);
      throw error;
    }
  },

  // SSL
  sslCerts: mockSSLCerts,
  addSSLCert: (cert) => {
    const newCert: SSLCertificate = {
      ...cert,
      id: `cert_${Date.now()}`
    };
    set((state) => ({ sslCerts: [...state.sslCerts, newCert] }));
  },
  deleteSSLCert: (id) => {
    set((state) => ({ sslCerts: state.sslCerts.filter((c) => c.id !== id) }));
  },

  // Alerts
  alerts: mockAlerts,
  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      )
    }));
  },

  // Users
  users: mockUsers,
  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}`
    };
    set((state) => ({ users: [...state.users, newUser] }));
  },
  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      )
    }));
  },
  deleteUser: (id) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },

  // ACL
  aclRules: mockACLRules,
  addACLRule: (rule) => {
    const newRule: ACLRule = {
      ...rule,
      id: `acl_${Date.now()}`
    };
    set((state) => ({ aclRules: [...state.aclRules, newRule] }));
  },
  updateACLRule: (id, updates) => {
    set((state) => ({
      aclRules: state.aclRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },
  deleteACLRule: (id) => {
    set((state) => ({ aclRules: state.aclRules.filter((r) => r.id !== id) }));
  },
  toggleACLRule: (id) => {
    set((state) => ({
      aclRules: state.aclRules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    }));
  }
}));
