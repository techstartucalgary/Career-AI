"""
Semantic matching engine using embeddings.
This is the core differentiator from competitors like AiApply.

Uses sentence transformers to find meaning-based matches between
job requirements and resume content, not just keyword matching.
"""

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Tuple, Dict, Set, Optional
import re
import spacy
from .config import SEMANTIC_MODEL, SEMANTIC_SIMILARITY_THRESHOLD, SEMANTIC_WEAK_MATCH_THRESHOLD
from .models import SemanticAnalysisResult


# Phrases to filter out from job descriptions - company marketing fluff, not actual requirements
BLOCKED_PHRASES = {
    # Company marketing fluff
    "global leader", "industry leader", "market leader", "world leader",
    "our team", "our company", "our mission", "our values", "our culture",
    "we are", "we offer", "we provide", "we believe", "we value",
    "learn more", "find out more", "discover more",
    "competitive salary", "competitive compensation", "great benefits",
    "equal opportunity", "equal opportunity employer", "eeo",
    "fast-paced environment", "dynamic environment", "exciting opportunity",
    "join our team", "be part of", "come join us",
    "about us", "about the company", "who we are", "what we do",
    "company description", "job description", "position description",
    "why join", "why work", "perks and benefits",
    "work-life balance", "flexible working", "remote friendly",
    "diverse and inclusive", "diversity and inclusion",
    "career growth", "professional development", "growth opportunities",
    "collaborative environment", "team environment",
    "innovative company", "cutting-edge", "state-of-the-art",
    "passionate team", "talented team", "amazing team",

    # Generic phrases that aren't skills
    "looking for", "seeking", "we need", "must have", "nice to have",
    "required", "preferred", "qualifications", "requirements",
    "responsibilities", "duties", "role", "position",
    "years of experience", "years experience", "x+ years",
    "the ideal candidate", "successful candidate", "right candidate",
    "ability to", "able to", "capable of",
    "strong", "excellent", "good", "great",
    "self-starter", "self-motivated", "go-getter",
    "team player", "works well with others",
    "attention to detail", "detail-oriented", "detail oriented",
    "deadline", "deadlines", "time management",

    # Education (not skills)
    "bachelor's degree", "bachelors degree", "bachelor degree",
    "master's degree", "masters degree", "master degree",
    "phd", "doctorate", "doctoral degree",
    "computer science", "cs degree", "engineering degree",
    "related field", "equivalent experience", "or equivalent",
    "degree in", "education in", "studied",

    # Location/logistics
    "on-site", "onsite", "hybrid", "remote", "in-office",
    "full-time", "full time", "part-time", "part time",
    "contract", "permanent", "temporary",
    "relocation", "visa sponsorship", "work authorization",

    # Meta/boilerplate
    "apply now", "submit resume", "send cv",
    "salary range", "compensation", "benefits package",
    "start date", "immediate start",
}

# Patterns that indicate non-skill content
BLOCKED_PATTERNS = [
    r"^\d+\+?\s*years?",  # "5+ years", "3 years"
    r"^(a|an|the)\s+\w+$",  # "a team", "the company"
    r"^\w{1,2}$",  # Single letters or two-letter words
    r"^(and|or|but|with|for|from|into|about)$",  # Conjunctions/prepositions
    r"equal\s+opportunity",
    r"salary|compensation|benefits",
    r"apply\s+(now|today|here)",
]


# Skill Taxonomy: Hierarchical relationships between skills
# Each skill maps to its parent categories and related skills
SKILL_TAXONOMY: Dict[str, Dict[str, any]] = {
    # Frontend Technologies
    "react": {
        "parents": ["javascript", "frontend development", "web development"],
        "related": ["redux", "next.js", "jsx", "react native"],
        "category": "frontend"
    },
    "angular": {
        "parents": ["typescript", "javascript", "frontend development", "web development"],
        "related": ["rxjs", "ngrx"],
        "category": "frontend"
    },
    "vue": {
        "parents": ["javascript", "frontend development", "web development"],
        "related": ["vuex", "nuxt.js"],
        "category": "frontend"
    },
    "next.js": {
        "parents": ["react", "javascript", "frontend development", "web development"],
        "related": ["vercel", "ssr"],
        "category": "frontend"
    },

    # Backend Technologies
    "node.js": {
        "parents": ["javascript", "backend development", "web development"],
        "related": ["express", "nestjs", "npm"],
        "category": "backend"
    },
    "django": {
        "parents": ["python", "backend development", "web development"],
        "related": ["django rest framework", "orm"],
        "category": "backend"
    },
    "flask": {
        "parents": ["python", "backend development", "web development"],
        "related": ["jinja2", "werkzeug"],
        "category": "backend"
    },
    "fastapi": {
        "parents": ["python", "backend development", "web development"],
        "related": ["pydantic", "async"],
        "category": "backend"
    },
    "spring": {
        "parents": ["java", "backend development", "web development"],
        "related": ["spring boot", "hibernate", "maven"],
        "category": "backend"
    },

    # Programming Languages
    "javascript": {
        "parents": ["programming", "web development"],
        "related": ["typescript", "es6", "node.js"],
        "category": "language"
    },
    "typescript": {
        "parents": ["javascript", "programming", "web development"],
        "related": ["type safety", "interfaces"],
        "category": "language"
    },
    "python": {
        "parents": ["programming"],
        "related": ["pip", "virtualenv", "jupyter"],
        "category": "language"
    },
    "java": {
        "parents": ["programming"],
        "related": ["jvm", "maven", "gradle"],
        "category": "language"
    },
    "go": {
        "parents": ["programming", "backend development"],
        "related": ["goroutines", "channels"],
        "category": "language"
    },
    "rust": {
        "parents": ["programming", "systems programming"],
        "related": ["cargo", "memory safety"],
        "category": "language"
    },

    # Data Science & ML
    "machine learning": {
        "parents": ["artificial intelligence", "data science"],
        "related": ["deep learning", "neural networks", "model training"],
        "category": "ml"
    },
    "deep learning": {
        "parents": ["machine learning", "artificial intelligence"],
        "related": ["neural networks", "tensorflow", "pytorch"],
        "category": "ml"
    },
    "tensorflow": {
        "parents": ["deep learning", "machine learning", "python"],
        "related": ["keras", "neural networks"],
        "category": "ml"
    },
    "pytorch": {
        "parents": ["deep learning", "machine learning", "python"],
        "related": ["neural networks", "tensors"],
        "category": "ml"
    },
    "scikit-learn": {
        "parents": ["machine learning", "python", "data science"],
        "related": ["numpy", "pandas"],
        "category": "ml"
    },
    "pandas": {
        "parents": ["python", "data science", "data analysis"],
        "related": ["numpy", "dataframes"],
        "category": "data"
    },
    "numpy": {
        "parents": ["python", "data science", "scientific computing"],
        "related": ["arrays", "linear algebra"],
        "category": "data"
    },

    # DevOps & Cloud
    "docker": {
        "parents": ["containerization", "devops"],
        "related": ["kubernetes", "containers", "docker-compose"],
        "category": "devops"
    },
    "kubernetes": {
        "parents": ["container orchestration", "devops", "cloud"],
        "related": ["docker", "helm", "k8s"],
        "category": "devops"
    },
    "aws": {
        "parents": ["cloud computing", "devops"],
        "related": ["ec2", "s3", "lambda", "cloudformation"],
        "category": "cloud"
    },
    "azure": {
        "parents": ["cloud computing", "devops"],
        "related": ["azure devops", "azure functions"],
        "category": "cloud"
    },
    "gcp": {
        "parents": ["cloud computing", "devops"],
        "related": ["google cloud", "bigquery", "cloud functions"],
        "category": "cloud"
    },
    "ci/cd": {
        "parents": ["devops", "automation"],
        "related": ["jenkins", "github actions", "gitlab ci"],
        "category": "devops"
    },
    "terraform": {
        "parents": ["infrastructure as code", "devops", "cloud"],
        "related": ["ansible", "cloudformation"],
        "category": "devops"
    },

    # Databases
    "postgresql": {
        "parents": ["sql", "database", "relational database"],
        "related": ["postgres", "sql queries"],
        "category": "database"
    },
    "mongodb": {
        "parents": ["nosql", "database"],
        "related": ["mongoose", "document database"],
        "category": "database"
    },
    "redis": {
        "parents": ["database", "caching", "in-memory database"],
        "related": ["key-value store"],
        "category": "database"
    },
    "mysql": {
        "parents": ["sql", "database", "relational database"],
        "related": ["mariadb"],
        "category": "database"
    },
    "sql": {
        "parents": ["database", "data"],
        "related": ["queries", "joins", "indexes"],
        "category": "database"
    },

    # APIs & Protocols
    "rest": {
        "parents": ["api", "web development"],
        "related": ["http", "json", "endpoints"],
        "category": "api"
    },
    "graphql": {
        "parents": ["api", "web development"],
        "related": ["apollo", "queries", "mutations"],
        "category": "api"
    },
    "grpc": {
        "parents": ["api", "microservices"],
        "related": ["protobuf", "rpc"],
        "category": "api"
    },

    # Version Control & Collaboration
    "git": {
        "parents": ["version control", "collaboration"],
        "related": ["github", "gitlab", "bitbucket"],
        "category": "tools"
    },
    "github": {
        "parents": ["git", "version control", "collaboration"],
        "related": ["github actions", "pull requests"],
        "category": "tools"
    },

    # Soft Skills
    "leadership": {
        "parents": ["soft skills", "management"],
        "related": ["team management", "mentoring", "decision making"],
        "category": "soft_skills"
    },
    "communication": {
        "parents": ["soft skills"],
        "related": ["presentation", "writing", "collaboration"],
        "category": "soft_skills"
    },
    "problem solving": {
        "parents": ["soft skills", "analytical skills"],
        "related": ["critical thinking", "debugging", "troubleshooting"],
        "category": "soft_skills"
    },
    "agile": {
        "parents": ["project management", "methodology"],
        "related": ["scrum", "kanban", "sprint"],
        "category": "methodology"
    },
}


class SkillTaxonomyManager:
    """
    Manages skill taxonomy for understanding skill hierarchies and relationships.

    Enables matching like:
    - Job requires "frontend development" → matches resume with "React"
    - Job requires "cloud computing" → matches resume with "AWS"
    """

    def __init__(self, taxonomy: Dict[str, Dict] = None):
        self.taxonomy = taxonomy or SKILL_TAXONOMY
        self._build_reverse_index()

    def _build_reverse_index(self):
        """Build reverse index from parent/related skills to children."""
        self.parent_to_children: Dict[str, Set[str]] = {}
        self.related_index: Dict[str, Set[str]] = {}

        for skill, data in self.taxonomy.items():
            # Index parents
            for parent in data.get("parents", []):
                parent_lower = parent.lower()
                if parent_lower not in self.parent_to_children:
                    self.parent_to_children[parent_lower] = set()
                self.parent_to_children[parent_lower].add(skill)

            # Index related skills (bidirectional)
            for related in data.get("related", []):
                related_lower = related.lower()
                if related_lower not in self.related_index:
                    self.related_index[related_lower] = set()
                self.related_index[related_lower].add(skill)

                if skill not in self.related_index:
                    self.related_index[skill] = set()
                self.related_index[skill].add(related_lower)

    def get_skill_hierarchy(self, skill: str) -> Set[str]:
        """
        Get all parent categories for a skill.

        Example: "react" → {"javascript", "frontend development", "web development"}
        """
        skill_lower = skill.lower()
        if skill_lower in self.taxonomy:
            return set(self.taxonomy[skill_lower].get("parents", []))
        return set()

    def get_child_skills(self, category: str) -> Set[str]:
        """
        Get all skills that belong to a category.

        Example: "frontend development" → {"react", "angular", "vue", ...}
        """
        return self.parent_to_children.get(category.lower(), set())

    def get_related_skills(self, skill: str) -> Set[str]:
        """
        Get skills related to the given skill.

        Example: "docker" → {"kubernetes", "containers", "docker-compose"}
        """
        skill_lower = skill.lower()
        related = set()

        if skill_lower in self.taxonomy:
            related.update(self.taxonomy[skill_lower].get("related", []))

        if skill_lower in self.related_index:
            related.update(self.related_index[skill_lower])

        return related

    def expand_skill(self, skill: str) -> Set[str]:
        """
        Expand a skill to include itself, parents, and related skills.

        This is useful for improving semantic matching by considering
        the full context of a skill mention.
        """
        skill_lower = skill.lower()
        expanded = {skill_lower}

        # Add parents (e.g., React → JavaScript, Frontend Development)
        expanded.update(self.get_skill_hierarchy(skill_lower))

        # Add related skills (e.g., React → Redux, Next.js)
        expanded.update(self.get_related_skills(skill_lower))

        return expanded

    def check_skill_match(self, job_skill: str, resume_skill: str) -> Tuple[bool, float]:
        """
        Check if a resume skill matches a job requirement using taxonomy.

        Returns:
            (is_match, confidence) where confidence is:
            - 1.0 for exact match
            - 0.9 for child skill matching parent category
            - 0.8 for parent skill matching child requirement
            - 0.7 for related skill match
            - 0.0 for no match
        """
        job_lower = job_skill.lower()
        resume_lower = resume_skill.lower()

        # Exact match
        if job_lower == resume_lower:
            return (True, 1.0)

        # Resume has child skill of job category
        # e.g., Job wants "frontend development", resume has "React"
        job_children = self.get_child_skills(job_lower)
        if resume_lower in job_children:
            return (True, 0.9)

        # Resume has parent skill of job requirement
        # e.g., Job wants "React", resume has "frontend development"
        resume_parents = self.get_skill_hierarchy(resume_lower)
        if job_lower in resume_parents:
            return (True, 0.8)

        # Check if job skill is a child of resume skill
        # e.g., Resume has "JavaScript", job wants "TypeScript" (sibling through parent)
        job_parents = self.get_skill_hierarchy(job_lower)
        resume_parents_lower = {p.lower() for p in self.get_skill_hierarchy(resume_lower)}
        if job_parents & resume_parents_lower:
            return (True, 0.75)

        # Related skill match
        job_related = self.get_related_skills(job_lower)
        if resume_lower in job_related:
            return (True, 0.7)

        resume_related = self.get_related_skills(resume_lower)
        if job_lower in resume_related:
            return (True, 0.7)

        return (False, 0.0)

    def extract_known_skills(self, text: str) -> List[str]:
        """
        Extract skills from text that are in our taxonomy.

        Returns list of matched skill names.
        """
        text_lower = text.lower()
        found_skills = []

        # Check for each skill in taxonomy
        for skill in self.taxonomy.keys():
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)

        return found_skills


class SemanticMatcher:
    """
    Semantic matching using embeddings to find skill/experience overlap.

    Unlike keyword matching, this understands that:
    - "Docker" is semantically similar to "containerization"
    - "collaborated" is similar to "teamwork"
    - "React" is related to "frontend development"

    Enhanced with:
    - spaCy NLP for proper noun phrase extraction
    - Skill taxonomy for hierarchical skill matching
    """

    def __init__(self, model_name: str = SEMANTIC_MODEL, spacy_model: str = "en_core_web_sm"):
        """
        Initialize semantic matcher with pre-trained models.

        Args:
            model_name: HuggingFace model name (default: all-MiniLM-L6-v2)
                       This model is 80MB, fast, and accurate for sentence similarity
            spacy_model: spaCy model for NLP (default: en_core_web_sm)
        """
        print(f"Loading semantic model: {model_name}...")
        self.model = SentenceTransformer(model_name)

        print(f"Loading NLP model: {spacy_model}...")
        try:
            self.nlp = spacy.load(spacy_model)
        except OSError:
            print(f"  Downloading {spacy_model}...")
            spacy.cli.download(spacy_model)
            self.nlp = spacy.load(spacy_model)

        print("Loading skill taxonomy...")
        self.taxonomy = SkillTaxonomyManager()

        print("✓ Semantic matching ready (with NLP & skill taxonomy)")

    def _get_match_type(self, confidence: float) -> str:
        """Convert taxonomy confidence score to human-readable match type."""
        if confidence >= 1.0:
            return "exact"
        elif confidence >= 0.9:
            return "child_of_category"  # e.g., React matches "frontend development"
        elif confidence >= 0.8:
            return "parent_category"  # e.g., "JavaScript" matches React requirement
        elif confidence >= 0.75:
            return "sibling_skill"  # e.g., TypeScript matches JavaScript (shared parent)
        elif confidence >= 0.7:
            return "related_skill"  # e.g., Docker matches Kubernetes
        else:
            return "weak_relation"

    def _is_valid_skill_phrase(self, phrase: str) -> bool:
        """
        Check if a phrase is a valid skill/requirement (not marketing fluff).

        Filters out:
        - Company marketing phrases ("global leader", "our team")
        - Generic job posting language ("looking for", "ideal candidate")
        - Education requirements being treated as skills
        - Meta text ("job description", "requirements")
        """
        phrase_lower = phrase.lower().strip()

        # Too short to be meaningful
        if len(phrase_lower) < 3:
            return False

        # Check against blocked phrases
        for blocked in BLOCKED_PHRASES:
            if blocked in phrase_lower:
                return False

        # Check against blocked patterns
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, phrase_lower, re.IGNORECASE):
                return False

        # If it's in our skill taxonomy, it's definitely valid
        if phrase_lower in self.taxonomy.taxonomy:
            return True

        # Check if it contains any known skill (good indicator)
        for skill in self.taxonomy.taxonomy.keys():
            if skill in phrase_lower:
                return True

        # Filter out phrases that are too generic (no technical content)
        # These are phrases with only common words and no technical terms
        generic_words = {
            'team', 'work', 'company', 'business', 'job', 'role', 'position',
            'candidate', 'opportunity', 'experience', 'skills', 'ability',
            'environment', 'culture', 'values', 'mission', 'vision',
            'looking', 'seeking', 'need', 'want', 'require', 'prefer',
            'strong', 'excellent', 'good', 'great', 'best', 'top',
            'new', 'innovative', 'exciting', 'dynamic', 'fast',
            'join', 'part', 'member', 'lead', 'support', 'help',
            'degree', 'bachelor', 'master', 'phd', 'education',
        }

        words = set(phrase_lower.split())
        # If ALL words are generic, reject
        if words and words.issubset(generic_words):
            return False

        return True

    def _extract_key_phrases(self, text: str, max_phrases: int = 50) -> List[str]:
        """
        Extract important phrases from text using spaCy NLP.

        Extracts:
        - Noun phrases (e.g., "machine learning model deployment")
        - Named entities (e.g., "Python", "AWS")
        - Skills from taxonomy
        - Key sentences with action verbs

        This properly handles multi-word skill phrases that simple
        sentence splitting would miss.
        """
        # Clean text
        text = re.sub(r'\s+', ' ', text.strip())

        if not text:
            return []

        # Process with spaCy
        doc = self.nlp(text)

        phrases: Set[str] = set()

        # 1. Extract noun phrases (captures multi-word skills like "machine learning model deployment")
        for chunk in doc.noun_chunks:
            phrase = chunk.text.strip()
            # Filter out very short or very long phrases
            if 2 <= len(phrase.split()) <= 6 and len(phrase) >= 3:
                phrases.add(phrase.lower())
            # Also add the root noun for single important terms
            if chunk.root.pos_ in ('NOUN', 'PROPN') and len(chunk.root.text) >= 2:
                phrases.add(chunk.root.text.lower())

        # 2. Extract named entities (technologies, organizations, etc.)
        for ent in doc.ents:
            if ent.label_ in ('ORG', 'PRODUCT', 'WORK_OF_ART', 'LAW', 'LANGUAGE'):
                phrases.add(ent.text.lower())

        # 3. Extract skills from our taxonomy
        taxonomy_skills = self.taxonomy.extract_known_skills(text)
        phrases.update(taxonomy_skills)

        # 4. Extract verb phrases for action-oriented matches
        #    (e.g., "developed microservices", "led team of 5")
        for token in doc:
            if token.pos_ == 'VERB' and token.dep_ == 'ROOT':
                # Get the verb and its direct objects/complements
                verb_phrase_parts = [token.text]
                for child in token.children:
                    if child.dep_ in ('dobj', 'pobj', 'attr', 'xcomp'):
                        # Include the subtree for the object
                        subtree_text = ' '.join([t.text for t in child.subtree])
                        if len(subtree_text.split()) <= 5:
                            verb_phrase_parts.append(subtree_text)

                if len(verb_phrase_parts) > 1:
                    verb_phrase = ' '.join(verb_phrase_parts)
                    if len(verb_phrase.split()) <= 6:
                        phrases.add(verb_phrase.lower())

        # 5. Also include key sentences (for context that noun phrases might miss)
        sentences = [sent.text.strip() for sent in doc.sents]
        # Prioritize sentences with action verbs or skill mentions
        skill_sentences = []
        for sent in sentences:
            sent_lower = sent.lower()
            # Check if sentence contains known skills
            has_skill = any(skill in sent_lower for skill in self.taxonomy.taxonomy.keys())
            # Check for action verbs
            has_action = any(word in sent_lower for word in [
                'developed', 'built', 'designed', 'implemented', 'created',
                'managed', 'led', 'improved', 'reduced', 'increased',
                'deployed', 'architected', 'optimized', 'automated'
            ])
            if has_skill or has_action:
                skill_sentences.append(sent)

        # Sort phrases by length (longer = more specific) and limit
        phrase_list = sorted(phrases, key=len, reverse=True)

        # Add skill-related sentences at the end
        phrase_list.extend(skill_sentences[:10])

        # Remove duplicates while preserving order, and filter out invalid phrases
        seen = set()
        unique_phrases = []
        for p in phrase_list:
            p_normalized = p.lower().strip()
            if p_normalized not in seen and len(p_normalized) >= 2:
                # Apply filtering to remove marketing fluff and non-skills
                if self._is_valid_skill_phrase(p_normalized):
                    seen.add(p_normalized)
                    unique_phrases.append(p)

        return unique_phrases[:max_phrases]
    
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Convert text into semantic vectors (embeddings).
        
        These vectors capture meaning, so similar phrases
        have similar vectors (high cosine similarity).
        
        Args:
            texts: List of text strings
            
        Returns:
            numpy array of embeddings, shape (len(texts), 384)
        """
        return self.model.encode(texts, show_progress_bar=False)
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts.
        
        Returns:
            Similarity score from 0 (completely different) to 1 (identical)
        """
        embeddings = self.get_embeddings([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    
    def find_semantic_matches(
        self, 
        resume_text: str, 
        job_description: str,
        similarity_threshold: float = SEMANTIC_SIMILARITY_THRESHOLD,
        weak_threshold: float = SEMANTIC_WEAK_MATCH_THRESHOLD
    ) -> SemanticAnalysisResult:
        """
        Find semantic overlap between resume and job description.
        
        This is the CORE function that differentiates you from competitors.
        
        Args:
            resume_text: Full resume as text
            job_description: Job posting text
            similarity_threshold: Below this = gap (default 0.5)
            weak_threshold: Below this but above threshold = weak match (default 0.75)
            
        Returns:
            SemanticAnalysisResult with gaps, matches, and overall score
        """
        print("\n🔍 Running semantic analysis (with NLP & skill taxonomy)...")

        # Extract key phrases from both texts using spaCy NLP
        job_phrases = self._extract_key_phrases(job_description)
        resume_phrases = self._extract_key_phrases(resume_text)

        # Also extract known skills for taxonomy matching
        job_skills = set(self.taxonomy.extract_known_skills(job_description))
        resume_skills = set(self.taxonomy.extract_known_skills(resume_text))

        if not job_phrases or not resume_phrases:
            print("⚠ Warning: Could not extract phrases from inputs")
            return SemanticAnalysisResult(
                overall_match=0.0,
                coverage=0.0,
                gaps=[],
                matches=[]
            )

        print(f"  Extracted {len(job_phrases)} job phrases, {len(resume_phrases)} resume phrases")
        print(f"  Found {len(job_skills)} job skills, {len(resume_skills)} resume skills in taxonomy")

        # Convert to embeddings (vectors)
        job_embeddings = self.get_embeddings(job_phrases)
        resume_embeddings = self.get_embeddings(resume_phrases)

        # Calculate similarity matrix
        # Shape: (len(job_phrases), len(resume_phrases))
        similarity_matrix = cosine_similarity(job_embeddings, resume_embeddings)

        # Analyze each job requirement
        gaps = []
        matches = []

        for i, job_phrase in enumerate(job_phrases):
            # Find best match in resume for this job requirement
            max_similarity = float(similarity_matrix[i].max())
            best_match_idx = int(similarity_matrix[i].argmax())
            best_resume_phrase = resume_phrases[best_match_idx]

            # Check for taxonomy-based matches to boost similarity
            taxonomy_boost = 0.0
            taxonomy_match_info = None

            # Check if any job skills in this phrase match resume skills via taxonomy
            for job_skill in job_skills:
                if job_skill in job_phrase.lower():
                    for resume_skill in resume_skills:
                        is_match, confidence = self.taxonomy.check_skill_match(job_skill, resume_skill)
                        if is_match and confidence > taxonomy_boost:
                            taxonomy_boost = confidence
                            taxonomy_match_info = {
                                'job_skill': job_skill,
                                'resume_skill': resume_skill,
                                'match_type': self._get_match_type(confidence)
                            }

            # Apply taxonomy boost (weighted combination)
            if taxonomy_boost > 0:
                # Blend semantic similarity with taxonomy confidence
                # Taxonomy can boost similarity by up to 0.3
                boosted_similarity = max_similarity + (taxonomy_boost * 0.3)
                max_similarity = min(boosted_similarity, 1.0)  # Cap at 1.0

            if max_similarity < similarity_threshold:
                # GAP: Job wants this, resume doesn't have it
                gap_entry = {
                    'job_requirement': job_phrase,
                    'best_match': best_resume_phrase,
                    'similarity': max_similarity,
                    'status': 'missing',
                    'severity': 'high' if max_similarity < 0.3 else 'medium'
                }
                if taxonomy_match_info:
                    gap_entry['taxonomy_hint'] = taxonomy_match_info
                gaps.append(gap_entry)
            elif max_similarity < weak_threshold:
                # WEAK MATCH: You have something related but could be stronger
                gap_entry = {
                    'job_requirement': job_phrase,
                    'best_match': best_resume_phrase,
                    'similarity': max_similarity,
                    'status': 'weak',
                    'severity': 'low'
                }
                if taxonomy_match_info:
                    gap_entry['taxonomy_hint'] = taxonomy_match_info
                gaps.append(gap_entry)
            else:
                # STRONG MATCH: You have this covered
                match_entry = {
                    'job_requirement': job_phrase,
                    'resume_evidence': best_resume_phrase,
                    'similarity': max_similarity
                }
                if taxonomy_match_info:
                    match_entry['taxonomy_match'] = taxonomy_match_info
                matches.append(match_entry)
        
        # Calculate metrics
        overall_match = float(similarity_matrix.max(axis=1).mean())
        coverage = len(matches) / len(job_phrases) if job_phrases else 0

        # Extract top missing skills - prioritize taxonomy skills over generic phrases
        missing_gaps = [g for g in gaps if g['status'] == 'missing']

        # Separate taxonomy-recognized skills from other phrases
        taxonomy_missing = []
        other_missing = []
        for g in missing_gaps:
            req = g['job_requirement'].lower()
            # Check if this contains a known skill from taxonomy
            has_taxonomy_skill = any(skill in req for skill in self.taxonomy.taxonomy.keys())
            if has_taxonomy_skill:
                taxonomy_missing.append(g)
            else:
                other_missing.append(g)

        # Prioritize taxonomy skills, then other gaps (sorted by lowest similarity)
        prioritized_missing = (
            sorted(taxonomy_missing, key=lambda x: x['similarity'])[:5] +
            sorted(other_missing, key=lambda x: x['similarity'])[:5]
        )

        top_missing = [g['job_requirement'][:100] for g in prioritized_missing[:5]]

        # Extract top matching skills - also prioritize taxonomy skills
        taxonomy_matches = []
        other_matches = []
        for m in matches:
            req = m['job_requirement'].lower()
            has_taxonomy_skill = any(skill in req for skill in self.taxonomy.taxonomy.keys())
            if has_taxonomy_skill:
                taxonomy_matches.append(m)
            else:
                other_matches.append(m)

        prioritized_matches = (
            sorted(taxonomy_matches, key=lambda x: x['similarity'], reverse=True)[:5] +
            sorted(other_matches, key=lambda x: x['similarity'], reverse=True)[:5]
        )

        top_matching = [m['job_requirement'][:100] for m in prioritized_matches[:5]]
        
        result = SemanticAnalysisResult(
            overall_match=overall_match,
            coverage=coverage,
            gaps=sorted(gaps, key=lambda x: x['similarity']),
            matches=sorted(matches, key=lambda x: x['similarity'], reverse=True),
            top_missing_skills=top_missing,
            top_matching_skills=top_matching
        )
        
        print(f"  ✓ Match Score: {overall_match:.1%}")
        print(f"  ✓ Coverage: {coverage:.1%}")
        print(f"  ✓ Strong Matches: {len(matches)}")
        print(f"  ✓ Gaps Found: {len([g for g in gaps if g['status'] == 'missing'])}")
        
        return result
    
    def find_related_skills(
        self, 
        skill: str, 
        skill_database: List[str], 
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Find skills semantically related to a given skill.
        
        Useful for skill recommendation: "You have Python, consider adding NumPy"
        
        Args:
            skill: Target skill (e.g., "Python")
            skill_database: List of all possible skills
            top_k: How many related skills to return
            
        Returns:
            List of (skill, similarity_score) tuples
        """
        if not skill_database:
            return []
        
        # Embed target skill
        skill_embedding = self.get_embeddings([skill])
        
        # Embed all skills in database
        db_embeddings = self.get_embeddings(skill_database)
        
        # Calculate similarities
        similarities = cosine_similarity(skill_embedding, db_embeddings)[0]
        
        # Get top K most similar (excluding the skill itself)
        top_indices = similarities.argsort()[-top_k-1:][::-1]
        
        results = []
        for idx in top_indices:
            if skill_database[idx].lower() != skill.lower():  # Exclude self
                results.append((skill_database[idx], float(similarities[idx])))
            if len(results) == top_k:
                break
        
        return results
