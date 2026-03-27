--
-- PostgreSQL database dump
--

\restrict UjOhZbQwVcfMrqZybpYdUlaB4zR74i18Gbt7JgwXXyI3ulMBLFAMxr2RRY9adYD

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-28 00:38:44

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16429)
-- Name: deadlines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deadlines (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    due_date date NOT NULL,
    assigned_role character varying(20) NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.deadlines OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16428)
-- Name: deadlines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deadlines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deadlines_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 221
-- Name: deadlines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deadlines_id_seq OWNED BY public.deadlines.id;


--
-- TOC entry 224 (class 1259 OID 16448)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(20) DEFAULT '#2d5299'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16447)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 223
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- TOC entry 226 (class 1259 OID 16464)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    col character varying(20) DEFAULT 'todo'::character varying,
    tag character varying(30) DEFAULT 'pill-blue'::character varying,
    priority character varying(30) DEFAULT 'pill-green'::character varying,
    assignee character varying(10),
    project_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    deadline date
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16463)
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 225
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- TOC entry 227 (class 1259 OID 16488)
-- Name: user_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_projects (
    user_id integer NOT NULL,
    project_id integer NOT NULL
);


ALTER TABLE public.user_projects OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16414)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16413)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4877 (class 2604 OID 16432)
-- Name: deadlines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines ALTER COLUMN id SET DEFAULT nextval('public.deadlines_id_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 16451)
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- TOC entry 4882 (class 2604 OID 16467)
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- TOC entry 4875 (class 2604 OID 16417)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4892 (class 2606 OID 16441)
-- Name: deadlines deadlines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines
    ADD CONSTRAINT deadlines_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 16457)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 16477)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 16494)
-- Name: user_projects user_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_pkey PRIMARY KEY (user_id, project_id);


--
-- TOC entry 4888 (class 2606 OID 16424)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 16426)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4899 (class 2606 OID 16442)
-- Name: deadlines deadlines_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines
    ADD CONSTRAINT deadlines_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4900 (class 2606 OID 16458)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4901 (class 2606 OID 16483)
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4902 (class 2606 OID 16478)
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4903 (class 2606 OID 16500)
-- Name: user_projects user_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4904 (class 2606 OID 16495)
-- Name: user_projects user_projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-03-28 00:38:44

--
-- PostgreSQL database dump complete
--

\unrestrict UjOhZbQwVcfMrqZybpYdUlaB4zR74i18Gbt7JgwXXyI3ulMBLFAMxr2RRY9adYD

