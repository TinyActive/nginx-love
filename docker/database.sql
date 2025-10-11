--
-- PostgreSQL database dump
--

\restrict YvxuzPHp5BbUt2Tk0I7PgEj4k0vX1B5HV6Iyi86RE1sb8eXISEIGef4a8kLRWP9

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AclAction; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."AclAction" AS ENUM (
    'allow',
    'deny',
    'challenge'
);



--
-- Name: AclField; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."AclField" AS ENUM (
    'ip',
    'geoip',
    'user_agent',
    'url',
    'method',
    'header'
);



--
-- Name: AclOperator; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."AclOperator" AS ENUM (
    'equals',
    'contains',
    'regex'
);



--
-- Name: AclType; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."AclType" AS ENUM (
    'whitelist',
    'blacklist'
);



--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."ActivityType" AS ENUM (
    'login',
    'logout',
    'config_change',
    'user_action',
    'security',
    'system'
);



--
-- Name: AlertSeverity; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."AlertSeverity" AS ENUM (
    'critical',
    'warning',
    'info'
);



--
-- Name: BackupStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."BackupStatus" AS ENUM (
    'success',
    'failed',
    'running',
    'pending'
);



--
-- Name: DomainStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."DomainStatus" AS ENUM (
    'active',
    'inactive',
    'error'
);



--
-- Name: LoadBalancerAlgorithm; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."LoadBalancerAlgorithm" AS ENUM (
    'round_robin',
    'least_conn',
    'ip_hash'
);



--
-- Name: NodeMode; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."NodeMode" AS ENUM (
    'master',
    'slave'
);



--
-- Name: NotificationChannelType; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."NotificationChannelType" AS ENUM (
    'email',
    'telegram'
);



--
-- Name: SSLStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."SSLStatus" AS ENUM (
    'valid',
    'expiring',
    'expired'
);



--
-- Name: SlaveNodeStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."SlaveNodeStatus" AS ENUM (
    'online',
    'offline',
    'syncing',
    'error'
);



--
-- Name: SyncLogStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."SyncLogStatus" AS ENUM (
    'success',
    'failed',
    'partial',
    'running'
);



--
-- Name: SyncLogType; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."SyncLogType" AS ENUM (
    'full_sync',
    'incremental_sync',
    'health_check'
);



--
-- Name: UpstreamStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."UpstreamStatus" AS ENUM (
    'up',
    'down',
    'checking'
);



--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'admin',
    'moderator',
    'viewer'
);



--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: nginx_love_user
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'inactive',
    'suspended'
);



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);



--
-- Name: acl_rules; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.acl_rules (
    id text NOT NULL,
    name text NOT NULL,
    type public."AclType" NOT NULL,
    "conditionField" public."AclField" NOT NULL,
    "conditionOperator" public."AclOperator" NOT NULL,
    "conditionValue" text NOT NULL,
    action public."AclAction" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    type public."ActivityType" NOT NULL,
    ip text NOT NULL,
    "userAgent" text NOT NULL,
    details text,
    success boolean DEFAULT true NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: alert_history; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.alert_history (
    id text NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    message text NOT NULL,
    source text NOT NULL,
    acknowledged boolean DEFAULT false NOT NULL,
    "acknowledgedBy" text,
    "acknowledgedAt" timestamp(3) without time zone,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: alert_rule_channels; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.alert_rule_channels (
    id text NOT NULL,
    "ruleId" text NOT NULL,
    "channelId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: alert_rules; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.alert_rules (
    id text NOT NULL,
    name text NOT NULL,
    condition text NOT NULL,
    threshold integer NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "checkInterval" integer DEFAULT 60 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: backup_files; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.backup_files (
    id text NOT NULL,
    "scheduleId" text,
    filename text NOT NULL,
    filepath text NOT NULL,
    size bigint NOT NULL,
    status public."BackupStatus" DEFAULT 'success'::public."BackupStatus" NOT NULL,
    type text DEFAULT 'full'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: backup_schedules; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.backup_schedules (
    id text NOT NULL,
    name text NOT NULL,
    schedule text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "lastRun" timestamp(3) without time zone,
    "nextRun" timestamp(3) without time zone,
    status public."BackupStatus" DEFAULT 'pending'::public."BackupStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: config_versions; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.config_versions (
    id text NOT NULL,
    version integer NOT NULL,
    "configHash" text NOT NULL,
    "configData" jsonb NOT NULL,
    "createdBy" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: config_versions_version_seq; Type: SEQUENCE; Schema: public; Owner: nginx_love_user
--

CREATE SEQUENCE public.config_versions_version_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: config_versions_version_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nginx_love_user
--

ALTER SEQUENCE public.config_versions_version_seq OWNED BY public.config_versions.version;


--
-- Name: domains; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.domains (
    id text NOT NULL,
    name text NOT NULL,
    status public."DomainStatus" DEFAULT 'inactive'::public."DomainStatus" NOT NULL,
    "sslEnabled" boolean DEFAULT false NOT NULL,
    "sslExpiry" timestamp(3) without time zone,
    "modsecEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "realIpCloudflare" boolean DEFAULT false NOT NULL,
    "realIpCustomCidrs" text[] DEFAULT ARRAY[]::text[],
    "realIpEnabled" boolean DEFAULT false NOT NULL
);



--
-- Name: installation_status; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.installation_status (
    id text NOT NULL,
    component text NOT NULL,
    status text NOT NULL,
    step text,
    message text,
    progress integer DEFAULT 0 NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: load_balancer_configs; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.load_balancer_configs (
    id text NOT NULL,
    "domainId" text NOT NULL,
    algorithm public."LoadBalancerAlgorithm" DEFAULT 'round_robin'::public."LoadBalancerAlgorithm" NOT NULL,
    "healthCheckEnabled" boolean DEFAULT true NOT NULL,
    "healthCheckInterval" integer DEFAULT 30 NOT NULL,
    "healthCheckTimeout" integer DEFAULT 5 NOT NULL,
    "healthCheckPath" text DEFAULT '/'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: modsec_crs_rules; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.modsec_crs_rules (
    id text NOT NULL,
    "domainId" text,
    "ruleFile" text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    enabled boolean DEFAULT true NOT NULL,
    paranoia integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: modsec_rules; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.modsec_rules (
    id text NOT NULL,
    "domainId" text,
    name text NOT NULL,
    category text NOT NULL,
    "ruleContent" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: nginx_configs; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.nginx_configs (
    id text NOT NULL,
    "configType" text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: notification_channels; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.notification_channels (
    id text NOT NULL,
    name text NOT NULL,
    type public."NotificationChannelType" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    config jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.performance_metrics (
    id text NOT NULL,
    domain text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "responseTime" double precision NOT NULL,
    throughput double precision NOT NULL,
    "errorRate" double precision NOT NULL,
    "requestCount" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone
);



--
-- Name: slave_nodes; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.slave_nodes (
    id text NOT NULL,
    name text NOT NULL,
    host text NOT NULL,
    port integer DEFAULT 3001 NOT NULL,
    "apiKey" text NOT NULL,
    status public."SlaveNodeStatus" DEFAULT 'offline'::public."SlaveNodeStatus" NOT NULL,
    "lastSeen" timestamp(3) without time zone,
    version text,
    "syncEnabled" boolean DEFAULT true NOT NULL,
    "syncInterval" integer DEFAULT 60 NOT NULL,
    "configHash" text,
    "lastSyncAt" timestamp(3) without time zone,
    latency integer,
    "cpuUsage" double precision,
    "memoryUsage" double precision,
    "diskUsage" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: ssl_certificates; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.ssl_certificates (
    id text NOT NULL,
    "domainId" text NOT NULL,
    "commonName" text NOT NULL,
    sans text[],
    issuer text NOT NULL,
    certificate text NOT NULL,
    "privateKey" text NOT NULL,
    chain text,
    "validFrom" timestamp(3) without time zone NOT NULL,
    "validTo" timestamp(3) without time zone NOT NULL,
    "autoRenew" boolean DEFAULT true NOT NULL,
    status public."SSLStatus" DEFAULT 'valid'::public."SSLStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.sync_logs (
    id text NOT NULL,
    "nodeId" text NOT NULL,
    type public."SyncLogType" NOT NULL,
    status public."SyncLogStatus" DEFAULT 'running'::public."SyncLogStatus" NOT NULL,
    "configHash" text,
    "changesCount" integer,
    "errorMessage" text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    duration integer
);



--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.system_configs (
    id text NOT NULL,
    "nodeMode" public."NodeMode" DEFAULT 'master'::public."NodeMode" NOT NULL,
    "masterApiEnabled" boolean DEFAULT true NOT NULL,
    "slaveApiEnabled" boolean DEFAULT false NOT NULL,
    "masterHost" text,
    "masterPort" integer,
    "masterApiKey" text,
    "syncInterval" integer DEFAULT 60 NOT NULL,
    "lastSyncHash" text,
    connected boolean DEFAULT false NOT NULL,
    "lastConnectedAt" timestamp(3) without time zone,
    "connectionError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: two_factor_auth; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.two_factor_auth (
    id text NOT NULL,
    "userId" text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    method text DEFAULT 'totp'::text NOT NULL,
    secret text,
    "backupCodes" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: upstreams; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.upstreams (
    id text NOT NULL,
    "domainId" text NOT NULL,
    host text NOT NULL,
    port integer NOT NULL,
    weight integer DEFAULT 1 NOT NULL,
    "maxFails" integer DEFAULT 3 NOT NULL,
    "failTimeout" integer DEFAULT 10 NOT NULL,
    status public."UpstreamStatus" DEFAULT 'checking'::public."UpstreamStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    protocol text DEFAULT 'http'::text NOT NULL,
    "sslVerify" boolean DEFAULT true NOT NULL
);



--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    bio text,
    location text,
    website text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionId" text NOT NULL,
    ip text NOT NULL,
    "userAgent" text NOT NULL,
    device text,
    location text,
    "lastActive" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: users; Type: TABLE; Schema: public; Owner: nginx_love_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "fullName" text NOT NULL,
    role public."UserRole" DEFAULT 'viewer'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    avatar text,
    phone text,
    timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "isFirstLogin" boolean DEFAULT true NOT NULL
);



--
-- Name: config_versions version; Type: DEFAULT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.config_versions ALTER COLUMN version SET DEFAULT nextval('public.config_versions_version_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
99ee734e-834f-4199-9228-fb6c2acb1383	52f51d0c3871786adabd525433fb601834dc12c011e66737dedc7ff87ce6f85f	2025-10-10 03:51:00.313147+00	20250930140957_initial_setup	\N	\N	2025-10-10 03:51:00.077895+00	1
117274cd-8bb8-48ee-8bae-f0e87430bc90	bf64c880e3efeeca15993664d9a046d87aa6b457258ab4da11f4b20bdfdcd520	2025-10-10 03:51:01.216041+00	20251009081041_add_real_ip_config	\N	\N	2025-10-10 03:51:01.205241+00	1
e7e83705-9f7b-4c5c-8285-89873ebd6c7b	dc878ea3eee4e078d8304194e2c17c4cc334cff6fba509cfcbcfa9ef1c1d1c74	2025-10-10 03:51:00.554494+00	20250930155130_add_domain_management	\N	\N	2025-10-10 03:51:00.315519+00	1
61cd1e77-bea2-49f1-925e-d1107bbd7fad	85ef35e80b41bf91b69854dc7711a9eb017804578bcf9fca362c2ffdc0a6c1ab	2025-10-10 03:51:00.574418+00	20250930165732_add_upstream_https_support	\N	\N	2025-10-10 03:51:00.558058+00	1
d0c93579-c9cf-4c1f-b54f-4e40f8cf5eae	3cdf7355c7d5d791f16d7b2a061a7e7fd228ff718b90e0167ffeea695e56c2df	2025-10-10 03:51:00.67535+00	20251001083220_separate_crs_and_custom_rules	\N	\N	2025-10-10 03:51:00.57734+00	1
37cad739-c6ae-4cab-9c7d-acd9ae14fa95	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-10-10 03:51:00.697747+00	20251001083755_separate_crs_and_custom_rules	\N	\N	2025-10-10 03:51:00.677898+00	1
406ea014-c204-4239-9010-4cece1bdeb7e	97e03fac137c6999ddb4e0e02e99ac83e09abc9547e3cd9b71df1a375ae2c639	2025-10-10 03:51:00.846724+00	20251001163237_add_performance_metrics	\N	\N	2025-10-10 03:51:00.701483+00	1
ddd1aeb6-e3c9-4c55-9e0c-da308aa454e5	d62ebb21a74bfe6d27089020c012f0485b01cee7ac2a62f9cf2898023788c1a0	2025-10-10 03:51:00.893723+00	20251002030304_add_alert_history	\N	\N	2025-10-10 03:51:00.851874+00	1
782acd95-87f8-4f98-a36a-77fa2c5fd74b	c52aeec6f10e1008a2684a58ead83b6fde907f382a4b4dff12f786e56576065c	2025-10-10 03:51:00.963974+00	20251006033542_add_backup_feature	\N	\N	2025-10-10 03:51:00.896201+00	1
62770d93-4809-4fad-bd3c-af398470e222	832894d3ca4a4d59108162c05ee9b41b7c0f7febbfe263c6dbaaf6c31d51cedd	2025-10-10 03:51:01.087398+00	20251006084450_add_slave_node_feature	\N	\N	2025-10-10 03:51:00.967473+00	1
d32d1898-64af-4352-bef8-e3b44e55d51e	72bb704fa65ff06af156dab94e86bf9afd17b49da905306c56772c331609c249	2025-10-10 03:51:01.159381+00	20251006092848_add_system_config_and_node_mode	\N	\N	2025-10-10 03:51:01.105742+00	1
0b5a72d9-ff63-4ec9-acb3-cc1a5479a514	3e93e0b05e4852855cd3ed3f8cf8a354295b2167381489a76ff4c541ab774adf	2025-10-10 03:51:01.175082+00	20251007145737_make_activity_log_user_id_optional	\N	\N	2025-10-10 03:51:01.161915+00	1
7c8654d8-fdd6-49d3-86fc-265c2181ee5b	56ffe8075275105c06c497b4c19c225f8da03eeedae6db084d54ebd3b8039c64	2025-10-10 03:51:01.191869+00	20251008110124_add_first_login_flag	\N	\N	2025-10-10 03:51:01.178549+00	1
dc94bb4f-eed1-4648-aed2-afe11abbdf59	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-10-10 03:51:01.202517+00	20251009081000_add_real_ip_config	\N	\N	2025-10-10 03:51:01.195348+00	1
\.


--
-- Data for Name: acl_rules; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.acl_rules (id, name, type, "conditionField", "conditionOperator", "conditionValue", action, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.activity_logs (id, "userId", action, type, ip, "userAgent", details, success, "timestamp") FROM stdin;
cmgkb7a3f0006ivw2yqdjwc95	cmgkb79yd0000ivw2v2bh58zf	User logged in	login	192.168.1.100	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	\N	t	2025-10-10 02:51:06.457
cmgkb7a3f0007ivw28wrmkbiu	cmgkb79yd0000ivw2v2bh58zf	Updated domain configuration for api.example.com	config_change	192.168.1.100	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	Modified SSL settings and upstream configuration	t	2025-10-10 01:51:06.457
cmgkb7a3f0008ivw2zvmfy3fl	cmgkb79yd0000ivw2v2bh58zf	Failed login attempt	security	203.0.113.42	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36	Invalid password	f	2025-10-09 03:51:06.457
cmgkb7a3f0009ivw2gcrq2wqd	cmgkb79yd0000ivw2v2bh58zf	Created new ACL rule	user_action	192.168.1.100	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	Added IP blacklist rule for 192.168.1.200	t	2025-10-08 03:51:06.457
cmgkb7a3f000aivw206am45um	cmgkb79yd0000ivw2v2bh58zf	Changed account password	security	192.168.1.100	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	\N	t	2025-10-07 03:51:06.457
\.


--
-- Data for Name: alert_history; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.alert_history (id, severity, message, source, acknowledged, "acknowledgedBy", "acknowledgedAt", "timestamp", "createdAt") FROM stdin;
\.


--
-- Data for Name: alert_rule_channels; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.alert_rule_channels (id, "ruleId", "channelId", "createdAt") FROM stdin;
\.


--
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.alert_rules (id, name, condition, threshold, severity, enabled, "checkInterval", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: backup_files; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.backup_files (id, "scheduleId", filename, filepath, size, status, type, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: backup_schedules; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.backup_schedules (id, name, schedule, enabled, "lastRun", "nextRun", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: config_versions; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.config_versions (id, version, "configHash", "configData", "createdBy", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.domains (id, name, status, "sslEnabled", "sslExpiry", "modsecEnabled", "createdAt", "updatedAt", "realIpCloudflare", "realIpCustomCidrs", "realIpEnabled") FROM stdin;
\.


--
-- Data for Name: installation_status; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.installation_status (id, component, status, step, message, progress, "startedAt", "completedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: load_balancer_configs; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.load_balancer_configs (id, "domainId", algorithm, "healthCheckEnabled", "healthCheckInterval", "healthCheckTimeout", "healthCheckPath", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: modsec_crs_rules; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.modsec_crs_rules (id, "domainId", "ruleFile", name, category, description, enabled, paranoia, "createdAt", "updatedAt") FROM stdin;
cmgkb7a3q000bivw2ume2zdzc	\N	REQUEST-942-APPLICATION-ATTACK-SQLI.conf	SQL Injection Protection	SQLi	Detects SQL injection attempts using OWASP CRS detection rules	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000civw2jsbz3vbr	\N	REQUEST-941-APPLICATION-ATTACK-XSS.conf	XSS Attack Prevention	XSS	Blocks cross-site scripting attacks	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000divw2oj7pc9d8	\N	REQUEST-932-APPLICATION-ATTACK-RCE.conf	RCE Detection	RCE	Remote code execution prevention	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000eivw2fzcnpuja	\N	REQUEST-930-APPLICATION-ATTACK-LFI.conf	LFI Protection	LFI	Local file inclusion prevention	f	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000fivw2vm7wtpku	\N	REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION.conf	Session Fixation	SESSION-FIXATION	Prevents session fixation attacks	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000givw2xhltzyjz	\N	REQUEST-933-APPLICATION-ATTACK-PHP.conf	PHP Attacks	PHP	PHP-specific attack prevention	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000hivw2c3dshtmw	\N	REQUEST-920-PROTOCOL-ENFORCEMENT.conf	Protocol Attacks	PROTOCOL-ATTACK	HTTP protocol attack prevention	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000iivw27gr2vxdy	\N	RESPONSE-950-DATA-LEAKAGES.conf	Data Leakage	DATA-LEAKAGES	Prevents sensitive data leakage	f	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000jivw2fxmqb4eu	\N	REQUEST-934-APPLICATION-ATTACK-GENERIC.conf	SSRF Protection	SSRF	Server-side request forgery prevention (part of generic attacks)	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
cmgkb7a3q000kivw2f5u7e43t	\N	RESPONSE-955-WEB-SHELLS.conf	Web Shell Detection	WEB-SHELL	Detects web shell uploads	t	1	2025-10-10 03:51:06.47	2025-10-10 03:51:06.47
\.


--
-- Data for Name: modsec_rules; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.modsec_rules (id, "domainId", name, category, "ruleContent", enabled, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: nginx_configs; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.nginx_configs (id, "configType", name, content, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notification_channels; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.notification_channels (id, name, type, enabled, config, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.performance_metrics (id, domain, "timestamp", "responseTime", throughput, "errorRate", "requestCount", "createdAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.refresh_tokens (id, "userId", token, "expiresAt", "createdAt", "revokedAt") FROM stdin;
\.


--
-- Data for Name: slave_nodes; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.slave_nodes (id, name, host, port, "apiKey", status, "lastSeen", version, "syncEnabled", "syncInterval", "configHash", "lastSyncAt", latency, "cpuUsage", "memoryUsage", "diskUsage", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ssl_certificates; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.ssl_certificates (id, "domainId", "commonName", sans, issuer, certificate, "privateKey", chain, "validFrom", "validTo", "autoRenew", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sync_logs; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.sync_logs (id, "nodeId", type, status, "configHash", "changesCount", "errorMessage", "startedAt", "completedAt", duration) FROM stdin;
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.system_configs (id, "nodeMode", "masterApiEnabled", "slaveApiEnabled", "masterHost", "masterPort", "masterApiKey", "syncInterval", "lastSyncHash", connected, "lastConnectedAt", "connectionError", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: two_factor_auth; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.two_factor_auth (id, "userId", enabled, method, secret, "backupCodes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: upstreams; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.upstreams (id, "domainId", host, port, weight, "maxFails", "failTimeout", status, "createdAt", "updatedAt", protocol, "sslVerify") FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.user_profiles (id, "userId", bio, location, website, "createdAt", "updatedAt") FROM stdin;
cmgkb79ye0001ivw2iix0n6tw	cmgkb79yd0000ivw2v2bh58zf	System administrator with full access	\N	\N	2025-10-10 03:51:06.278	2025-10-10 03:51:06.278
cmgkb7a0u0003ivw2ikjyecag	cmgkb7a0u0002ivw274ecw7rv	System operator	\N	\N	2025-10-10 03:51:06.367	2025-10-10 03:51:06.367
cmgkb7a350005ivw2aj6a168v	cmgkb7a350004ivw2gttu2bbg	Read-only access user	\N	\N	2025-10-10 03:51:06.449	2025-10-10 03:51:06.449
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.user_sessions (id, "userId", "sessionId", ip, "userAgent", device, location, "lastActive", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nginx_love_user
--

COPY public.users (id, username, email, password, "fullName", role, status, avatar, phone, timezone, language, "createdAt", "updatedAt", "lastLogin", "isFirstLogin") FROM stdin;
cmgkb79yd0000ivw2v2bh58zf	admin	admin@example.com	$2b$10$hLKGJe685RHoCK/MGpUc9OJd//7DHZgJT9mNUWND.oMZHkclTcCWq	System Administrator	admin	active	https://api.dicebear.com/7.x/avataaars/svg?seed=admin	+84 123 456 789	Asia/Ho_Chi_Minh	vi	2025-10-10 03:51:06.278	2025-10-10 03:51:06.278	2025-10-10 03:51:06.275	t
cmgkb7a0u0002ivw274ecw7rv	operator	operator@example.com	$2b$10$4dkgEFEkVmxXvM3dOMIeOuTZft.PTYi0p9DrMIaTWb7Xy/bVzQg/W	System Operator	moderator	inactive	https://api.dicebear.com/7.x/avataaars/svg?seed=operator	+84 987 654 321	Asia/Ho_Chi_Minh	en	2025-10-10 03:51:06.367	2025-10-10 03:51:06.367	2025-10-09 03:51:06.365	t
cmgkb7a350004ivw2gttu2bbg	viewer	viewer@example.com	$2b$10$PKH249jI0.kUrN6dVbUt3.b61G4fhpTkqAIEfS4A2whEkdjaNGdiG	Read Only User	viewer	inactive	https://api.dicebear.com/7.x/avataaars/svg?seed=viewer	\N	Asia/Singapore	en	2025-10-10 03:51:06.449	2025-10-10 03:51:06.449	2025-10-08 03:51:06.448	t
\.


--
-- Name: config_versions_version_seq; Type: SEQUENCE SET; Schema: public; Owner: nginx_love_user
--

SELECT pg_catalog.setval('public.config_versions_version_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: acl_rules acl_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.acl_rules
    ADD CONSTRAINT acl_rules_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: alert_history alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_pkey PRIMARY KEY (id);


--
-- Name: alert_rule_channels alert_rule_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.alert_rule_channels
    ADD CONSTRAINT alert_rule_channels_pkey PRIMARY KEY (id);


--
-- Name: alert_rules alert_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.alert_rules
    ADD CONSTRAINT alert_rules_pkey PRIMARY KEY (id);


--
-- Name: backup_files backup_files_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.backup_files
    ADD CONSTRAINT backup_files_pkey PRIMARY KEY (id);


--
-- Name: backup_schedules backup_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.backup_schedules
    ADD CONSTRAINT backup_schedules_pkey PRIMARY KEY (id);


--
-- Name: config_versions config_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.config_versions
    ADD CONSTRAINT config_versions_pkey PRIMARY KEY (id);


--
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);


--
-- Name: installation_status installation_status_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.installation_status
    ADD CONSTRAINT installation_status_pkey PRIMARY KEY (id);


--
-- Name: load_balancer_configs load_balancer_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.load_balancer_configs
    ADD CONSTRAINT load_balancer_configs_pkey PRIMARY KEY (id);


--
-- Name: modsec_crs_rules modsec_crs_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.modsec_crs_rules
    ADD CONSTRAINT modsec_crs_rules_pkey PRIMARY KEY (id);


--
-- Name: modsec_rules modsec_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.modsec_rules
    ADD CONSTRAINT modsec_rules_pkey PRIMARY KEY (id);


--
-- Name: nginx_configs nginx_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.nginx_configs
    ADD CONSTRAINT nginx_configs_pkey PRIMARY KEY (id);


--
-- Name: notification_channels notification_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.notification_channels
    ADD CONSTRAINT notification_channels_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: slave_nodes slave_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.slave_nodes
    ADD CONSTRAINT slave_nodes_pkey PRIMARY KEY (id);


--
-- Name: ssl_certificates ssl_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.ssl_certificates
    ADD CONSTRAINT ssl_certificates_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_pkey PRIMARY KEY (id);


--
-- Name: upstreams upstreams_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.upstreams
    ADD CONSTRAINT upstreams_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_type_timestamp_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX activity_logs_type_timestamp_idx ON public.activity_logs USING btree (type, "timestamp");


--
-- Name: activity_logs_userId_timestamp_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "activity_logs_userId_timestamp_idx" ON public.activity_logs USING btree ("userId", "timestamp");


--
-- Name: alert_history_acknowledged_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX alert_history_acknowledged_idx ON public.alert_history USING btree (acknowledged);


--
-- Name: alert_history_severity_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX alert_history_severity_idx ON public.alert_history USING btree (severity);


--
-- Name: alert_history_timestamp_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX alert_history_timestamp_idx ON public.alert_history USING btree ("timestamp");


--
-- Name: alert_rule_channels_channelId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "alert_rule_channels_channelId_idx" ON public.alert_rule_channels USING btree ("channelId");


--
-- Name: alert_rule_channels_ruleId_channelId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "alert_rule_channels_ruleId_channelId_key" ON public.alert_rule_channels USING btree ("ruleId", "channelId");


--
-- Name: alert_rule_channels_ruleId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "alert_rule_channels_ruleId_idx" ON public.alert_rule_channels USING btree ("ruleId");


--
-- Name: backup_files_createdAt_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "backup_files_createdAt_idx" ON public.backup_files USING btree ("createdAt");


--
-- Name: backup_files_scheduleId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "backup_files_scheduleId_idx" ON public.backup_files USING btree ("scheduleId");


--
-- Name: config_versions_configHash_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "config_versions_configHash_key" ON public.config_versions USING btree ("configHash");


--
-- Name: config_versions_createdAt_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "config_versions_createdAt_idx" ON public.config_versions USING btree ("createdAt");


--
-- Name: domains_name_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX domains_name_idx ON public.domains USING btree (name);


--
-- Name: domains_name_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX domains_name_key ON public.domains USING btree (name);


--
-- Name: domains_status_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX domains_status_idx ON public.domains USING btree (status);


--
-- Name: installation_status_component_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX installation_status_component_key ON public.installation_status USING btree (component);


--
-- Name: load_balancer_configs_domainId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "load_balancer_configs_domainId_key" ON public.load_balancer_configs USING btree ("domainId");


--
-- Name: modsec_crs_rules_category_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX modsec_crs_rules_category_idx ON public.modsec_crs_rules USING btree (category);


--
-- Name: modsec_crs_rules_domainId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "modsec_crs_rules_domainId_idx" ON public.modsec_crs_rules USING btree ("domainId");


--
-- Name: modsec_crs_rules_ruleFile_domainId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "modsec_crs_rules_ruleFile_domainId_key" ON public.modsec_crs_rules USING btree ("ruleFile", "domainId");


--
-- Name: modsec_rules_category_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX modsec_rules_category_idx ON public.modsec_rules USING btree (category);


--
-- Name: modsec_rules_domainId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "modsec_rules_domainId_idx" ON public.modsec_rules USING btree ("domainId");


--
-- Name: nginx_configs_configType_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "nginx_configs_configType_idx" ON public.nginx_configs USING btree ("configType");


--
-- Name: performance_metrics_domain_timestamp_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX performance_metrics_domain_timestamp_idx ON public.performance_metrics USING btree (domain, "timestamp");


--
-- Name: performance_metrics_timestamp_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX performance_metrics_timestamp_idx ON public.performance_metrics USING btree ("timestamp");


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: slave_nodes_apiKey_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "slave_nodes_apiKey_key" ON public.slave_nodes USING btree ("apiKey");


--
-- Name: slave_nodes_lastSeen_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "slave_nodes_lastSeen_idx" ON public.slave_nodes USING btree ("lastSeen");


--
-- Name: slave_nodes_name_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX slave_nodes_name_key ON public.slave_nodes USING btree (name);


--
-- Name: slave_nodes_status_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX slave_nodes_status_idx ON public.slave_nodes USING btree (status);


--
-- Name: ssl_certificates_domainId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "ssl_certificates_domainId_idx" ON public.ssl_certificates USING btree ("domainId");


--
-- Name: ssl_certificates_domainId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "ssl_certificates_domainId_key" ON public.ssl_certificates USING btree ("domainId");


--
-- Name: ssl_certificates_validTo_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "ssl_certificates_validTo_idx" ON public.ssl_certificates USING btree ("validTo");


--
-- Name: sync_logs_nodeId_startedAt_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "sync_logs_nodeId_startedAt_idx" ON public.sync_logs USING btree ("nodeId", "startedAt");


--
-- Name: two_factor_auth_userId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "two_factor_auth_userId_key" ON public.two_factor_auth USING btree ("userId");


--
-- Name: upstreams_domainId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "upstreams_domainId_idx" ON public.upstreams USING btree ("domainId");


--
-- Name: user_profiles_userId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "user_profiles_userId_key" ON public.user_profiles USING btree ("userId");


--
-- Name: user_sessions_sessionId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "user_sessions_sessionId_idx" ON public.user_sessions USING btree ("sessionId");


--
-- Name: user_sessions_sessionId_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON public.user_sessions USING btree ("sessionId");


--
-- Name: user_sessions_userId_idx; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE INDEX "user_sessions_userId_idx" ON public.user_sessions USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: nginx_love_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alert_rule_channels alert_rule_channels_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.alert_rule_channels
    ADD CONSTRAINT "alert_rule_channels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.notification_channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alert_rule_channels alert_rule_channels_ruleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.alert_rule_channels
    ADD CONSTRAINT "alert_rule_channels_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES public.alert_rules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: backup_files backup_files_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.backup_files
    ADD CONSTRAINT "backup_files_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public.backup_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: load_balancer_configs load_balancer_configs_domainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.load_balancer_configs
    ADD CONSTRAINT "load_balancer_configs_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: modsec_crs_rules modsec_crs_rules_domainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.modsec_crs_rules
    ADD CONSTRAINT "modsec_crs_rules_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: modsec_rules modsec_rules_domainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.modsec_rules
    ADD CONSTRAINT "modsec_rules_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ssl_certificates ssl_certificates_domainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.ssl_certificates
    ADD CONSTRAINT "ssl_certificates_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sync_logs sync_logs_nodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT "sync_logs_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES public.slave_nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: two_factor_auth two_factor_auth_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT "two_factor_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: upstreams upstreams_domainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.upstreams
    ADD CONSTRAINT "upstreams_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nginx_love_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YvxuzPHp5BbUt2Tk0I7PgEj4k0vX1B5HV6Iyi86RE1sb8eXISEIGef4a8kLRWP9

