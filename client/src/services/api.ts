export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectData {
  projectId: string;
  name: string;
  description: string;
  ownerId: string;
  documentCount?: number;
  createdAt?: string | unknown;
  updatedAt?: string | unknown;
}

export interface HealthResponse {
  success: boolean;
  services: {
    server: string;
    gemini: {
      status: string;
      model: string;
      modelDisplayName: string;
    };
    firebase: string;
  };
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  project: ProjectData;
}

export interface GetProjectResponse {
  success: boolean;
  project: ProjectData;
  message?: string;
}

export interface GetProjectsResponse {
  success: boolean;
  count: number;
  projects: ProjectData[];
  message?: string;
}

export interface PersistedDocumentMeta {
  documentId: string;
  originalName: string;
  storedName?: string;
  format: string;
  size: number;
  pageCount: number;
  extractedTextPreview?: string | null;
  uploadedBy?: string;
  createdAt?: string;
}

export interface ProjectHandoverData {
  projectId: string;
  totalDocuments: number;
  documents: PersistedDocumentMeta[];
  analysis: AnalysisResult | null;
  reviews?: Record<string, FindingReview>;
  report: string | null;
}

export interface GetProjectHandoverResponse {
  success: boolean;
  handover: ProjectHandoverData;
  message?: string;
}

export interface UploadedDocMeta {
  documentId: string;
  originalName: string;
  format: string;
  size: number;
  pageCount: number;
  extractedTextPreview?: string | null;
}

export interface AnalysisFindingEvidence {
  documentId: string;
  sourceFile: string;
  quote: string;
  pageNumber?: number | null;
  section?: string | null;
  verified?: boolean;
}

export type EvidenceStatus =
  | 'source-supported'
  | 'inferred-needs-confirmation'
  | 'evidence-missing';

export type HumanReviewStatus =
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'changes-requested';

export interface FindingReview {
  findingId: string;
  status: HumanReviewStatus;
  reviewedBy: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  comment?: string;
  findingTitle?: string;
}

export interface AnalysisFinding {
  id: string;
  title: string;
  description: string;
  evidenceStatus?: EvidenceStatus | string;
  evidence?: AnalysisFindingEvidence[];
  verifiedEvidence?: AnalysisFindingEvidence[];
  verificationReason?: string;
  reviewStatus?: HumanReviewStatus;
  review?: FindingReview;
}

export interface ConflictClaim {
  claim: string;
  sourceFile: string;
  documentId?: string;
  quote?: string;
  pageNumber?: number | null;
  evidenceStatus?: EvidenceStatus | string;
  verified?: boolean;
  verificationReason?: string;
}

export interface DocumentConflict {
  id: string;
  title: string;
  description: string;
  resolutionStatus: 'unresolved' | 'resolved' | 'dismissed';
  claims: ConflictClaim[];
  reviewStatus?: HumanReviewStatus;
  review?: FindingReview;
}

export interface AnalysisResult {
  projectName?: string;
  projectSummary?: string;
  decisions?: AnalysisFinding[];
  tasks?: AnalysisFinding[];
  blockers?: AnalysisFinding[];
  dependencies?: AnalysisFinding[];
  people?: AnalysisFinding[];
  missingInformation?: AnalysisFinding[];
  conflicts?: DocumentConflict[];
}

export interface UploadDocumentsResponse {
  success: boolean;
  message: string;
  projectId: string;
  totalDocuments: number;
  saved: {
    savedDocuments: number;
    analysisSaved: boolean;
    reportSaved: boolean;
  };
  documents: UploadedDocMeta[];
  analysis: AnalysisResult;
  report: string;
}


const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'https://handoverx-backend.onrender.com'
      : 'http://localhost:5000');
};


// ==========================================
// Network-Resilient Request Wrapper
// ==========================================
interface RequestApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  idToken?: string;
}

async function requestApi<T>(
  endpoint: string,
  options: RequestApiOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  // If a stringified body is passed and no Content-Type header is explicitly set,
  // ensure Content-Type is set to application/json so Express body parsers can parse it
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.idToken) {
    headers['Authorization'] = `Bearer ${options.idToken}`;
  }

  const primaryUrl = `${baseUrl}${endpoint}`;

  // Build dual-stack fallback for Windows localhost / 127.0.0.1 resolution
  let fallbackUrl: string | null = null;
  if (baseUrl.includes('localhost')) {
    fallbackUrl = `${baseUrl.replace('localhost', '127.0.0.1')}${endpoint}`;
  } else if (baseUrl.includes('127.0.0.1')) {
    fallbackUrl = `${baseUrl.replace('127.0.0.1', 'localhost')}${endpoint}`;
  }

  let response: Response;
  try {
    response = await fetch(primaryUrl, {
      method: options.method || 'GET',
      headers,
      body: options.body,
    });
  } catch {
    // If primary attempt failed at the network/socket layer, try dual-stack loopback fallback
    if (fallbackUrl) {
      try {
        response = await fetch(fallbackUrl, {
          method: options.method || 'GET',
          headers,
          body: options.body,
        });
      } catch {
        throw new Error(
          `Unable to connect to the HandoverX backend server at ${baseUrl}. Please ensure the server is running.`
        );
      }
    } else {
      throw new Error(
        `Unable to connect to the HandoverX backend server at ${baseUrl}. Please ensure the server is running.`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  try {
    result = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errorMsg =
      (result && result.message) ||
      (response.status === 401
        ? 'Invalid or expired authentication session. Please sign in again.'
        : response.status === 403
          ? 'You do not have access to this project or resource.'
          : response.status === 404
            ? 'The requested resource was not found on the server.'
            : `Request failed with HTTP status ${response.status}.`);

    throw new Error(errorMsg);
  }

  return result as T;
}

// ==========================================
// Cache & Request Deduplication Layer
// ==========================================
const CACHE_TTL_MS = 30 * 1000; // 30 seconds fresh cache

interface CacheItem<T> {
  data: T;
  timestamp: number;
  tokenHash: string;
}

let cachedProjects: CacheItem<GetProjectsResponse> | null = null;
const cachedHandovers = new Map<string, CacheItem<GetProjectHandoverResponse>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();

export function clearApiCaches(): void {
  cachedProjects = null;
  cachedHandovers.clear();
  pendingRequests.clear();
}

export function invalidateProjectsCache(): void {
  cachedProjects = null;
}

export function invalidateHandoverCache(projectId?: string): void {
  if (projectId) {
    cachedHandovers.delete(projectId);
  } else {
    cachedHandovers.clear();
  }
}

/**
 * Checks server and Gemini connectivity status.
 */
export async function getHealthApi(): Promise<HealthResponse> {
  return await requestApi<HealthResponse>('/api/health');
}

/**
 * Creates a real project in Firestore through the HandoverX backend API.
 * The backend registers the authenticated user as the project owner.
 */
export async function createProjectApi(
  data: CreateProjectRequest,
  idToken: string
): Promise<CreateProjectResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required to create a project.');
  }

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Project name is required.');
  }

  const result = await requestApi<CreateProjectResponse>('/api/projects', {
    method: 'POST',
    idToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: trimmedName,
      description: data.description ? data.description.trim() : '',
    }),
  });

  // Invalidate cached projects on successful creation
  invalidateProjectsCache();

  return result;
}

/**
 * Lists all real Firestore projects where the authenticated user is an owner or member.
 * Employs in-memory caching and request deduplication for performance.
 */
export async function getProjectsApi(
  idToken: string,
  forceRefresh = false
): Promise<GetProjectsResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required to fetch projects.');
  }

  const tokenHash = idToken.slice(-16);
  const now = Date.now();

  // Return fresh cache if available
  if (!forceRefresh && cachedProjects && cachedProjects.tokenHash === tokenHash) {
    if (now - cachedProjects.timestamp < CACHE_TTL_MS) {
      return cachedProjects.data;
    }
  }

  // Deduplicate in-flight requests
  const requestKey = `projects-${tokenHash}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<GetProjectsResponse>;
  }

  const requestPromise = (async () => {
    try {
      const result = await requestApi<GetProjectsResponse>('/api/projects', {
        method: 'GET',
        idToken,
      });

      cachedProjects = {
        data: result,
        timestamp: Date.now(),
        tokenHash,
      };

      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}

/**
 * Fetches real project details from the backend.
 * The backend verifies that the authenticated user is a member of the project.
 */
export async function getProjectApi(
  projectId: string,
  idToken: string
): Promise<GetProjectResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }

  if (!projectId) {
    throw new Error('Project ID is required.');
  }

  return await requestApi<GetProjectResponse>(`/api/projects/${projectId}`, {
    method: 'GET',
    idToken,
  });
}

/**
 * Fetches full persisted handover data (documents, latest analysis, latest report)
 * for a project from Firestore with membership verification.
 */
export async function getProjectHandoverApi(
  projectId: string,
  idToken: string,
  forceRefresh = false
): Promise<GetProjectHandoverResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }

  if (!projectId) {
    throw new Error('Project ID is required.');
  }

  const tokenHash = idToken.slice(-16);
  const now = Date.now();
  const cached = cachedHandovers.get(projectId);

  if (!forceRefresh && cached && cached.tokenHash === tokenHash) {
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Deduplicate in-flight requests
  const requestKey = `handover-${projectId}-${tokenHash}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<GetProjectHandoverResponse>;
  }

  const requestPromise = (async () => {
    try {
      const result = await requestApi<GetProjectHandoverResponse>(
        `/api/projects/${projectId}/handover`,
        {
          method: 'GET',
          idToken,
        }
      );

      cachedHandovers.set(projectId, {
        data: result,
        timestamp: Date.now(),
        tokenHash,
      });

      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Uploads project documents to the HandoverX backend for text extraction,
 * Gemini AI analysis, and handover report generation.
 */
export async function uploadDocumentsApi(
  projectId: string,
  files: File[],
  idToken: string
): Promise<UploadDocumentsResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required to upload documents.');
  }

  if (!projectId) {
    throw new Error('A valid Firestore Project ID is required. Please create or select a project.');
  }

  if (!files || files.length === 0) {
    throw new Error('Please select at least one document to upload.');
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new Error(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload.`);
  }

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(
        `Invalid format for "${file.name}". Only PDF, DOCX, TXT, and MD files are allowed.`
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File "${file.name}" exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
      );
    }
  }

  const formData = new FormData();
  formData.append('projectId', projectId);
  files.forEach((file) => {
    formData.append('documents', file, file.name);
  });

  const result = await requestApi<UploadDocumentsResponse>('/api/upload', {
    method: 'POST',
    idToken,
    body: formData,
  });

  // Invalidate handover and project caches so UI reflects new documents and counts
  invalidateHandoverCache(projectId);
  invalidateProjectsCache();

  return result;
}

export interface SubmitFindingReviewParams {
  status: HumanReviewStatus;
  comment?: string;
  findingTitle?: string;
  editedTitle?: string;
  editedDescription?: string;
}

export interface SubmitFindingReviewResponse {
  success: boolean;
  message: string;
  review: FindingReview;
  analysis?: AnalysisResult;
  report?: string;
}

export async function submitFindingReviewApi(
  projectId: string,
  findingId: string,
  params: SubmitFindingReviewParams,
  idToken: string
): Promise<SubmitFindingReviewResponse> {
  if (!projectId || !projectId.trim()) {
    throw new Error('Project ID is required.');
  }
  if (!findingId || !findingId.trim()) {
    throw new Error('Finding ID is required.');
  }

  const result = await requestApi<SubmitFindingReviewResponse>(
    `/api/projects/${projectId}/reviews`,
    {
      method: 'POST',
      idToken,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        findingId: findingId.trim(),
        status: params.status,
        comment: params.comment ? params.comment.trim() : undefined,
        findingTitle: params.findingTitle ? params.findingTitle.trim() : undefined,
        editedTitle: params.editedTitle ? params.editedTitle.trim() : undefined,
        editedDescription: params.editedDescription ? params.editedDescription.trim() : undefined,
      }),
    }
  );

  // Invalidate handover cache so any subsequent fetch gets fresh reviews
  invalidateHandoverCache(projectId);

  return result;
}
