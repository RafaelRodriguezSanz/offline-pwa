export const CURRICULUM = [
  {
    "labelClass": "gofai-label",
    "labelText": "Área 1 — GOFAI",
    "title": "Inteligencia Artificial Clásica",
    "desc": "Razonamiento simbólico, lógica formal y búsqueda. La IA antes del aprendizaje automático.",
    "modules": [
      {
        "url": "gofai/sistemas-expertos.html",
        "class": "card-gofai",
        "title": "Sistemas Expertos & Motores de Inferencia",
        "desc": "Bases de conocimiento, reglas IF→THEN, forward y backward chaining. Demo: diagnóstico médico paso a paso.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "lógica" }
        ]
      },
      {
        "url": "gofai/busqueda-grafos.html",
        "class": "card-gofai",
        "title": "Búsqueda en Grafos: BFS, DFS & A*",
        "desc": "Espacios de estado, heurísticas admisibles, función $f = g + h$. Demo: laberinto con traza visual.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "algoritmos" }
        ]
      },
      {
        "url": "gofai/juegos-suma-cero.html",
        "class": "card-gofai",
        "title": "Juegos de Suma Cero: Minimax & Alfa-Beta",
        "desc": "Árboles de juego, turno MAX/MIN, poda de ramas. Demo: Juega Tic-Tac-Toe contra un Minimax perfecto.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "gofai/logica-primer-orden.html",
        "class": "card-gofai",
        "title": "Lógica de Primer Orden & Resolución",
        "desc": "Predicados, cuantificadores, unificación de Robinson, Prolog. Demo: motor de resolución en browser.",
        "tags": [
          { "class": "tag-code", "text": "código" },
          { "class": "tag-math", "text": "lógica" }
        ]
      },
      {
        "url": "gofai/satisfaccion-restricciones.html",
        "class": "card-gofai",
        "title": "Satisfacción de Restricciones (CSP)",
        "desc": "Variables, dominios, arc-consistency (AC-3), backtracking. Demo: N-Reinas y Sudoku interactivo.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      }
    ]
  },
  {
    "labelClass": "ml-label",
    "labelText": "Área 2 — Machine Learning",
    "title": "Aprendizaje Estadístico",
    "desc": "El giro de \"escribir reglas\" a \"aprender de datos\". Probabilidad, optimización y generalización.",
    "modules": [
      {
        "url": "ml/regresion-lineal.html",
        "class": "card-ml",
        "title": "Regresión Lineal & Gradiente Descendente",
        "desc": "MSE, derivadas parciales, learning rate, convergencia. Demo: ajustá la recta en tiempo real.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "cálculo" }
        ]
      },
      {
        "url": "ml/kmeans-clustering.html",
        "class": "card-ml",
        "title": "Aprendizaje No Supervisado: K-Means",
        "desc": "Clustering, centroides, distancia euclidiana, descubrimiento de patrones. Demo: Agrupación interactiva 2D.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "ml/reduccion-dimensionalidad.html",
        "class": "card-ml",
        "title": "Reducción de Dimensionalidad: PCA & t-SNE",
        "desc": "Varianza máxima, compresión del espacio. Demo: Proyecta una nube 3D a 2D matemáticamente.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "ml/clasificacion-logistica.html",
        "class": "card-ml",
        "title": "Clasificación: Logística, SVM & KNN",
        "desc": "Fronteras de decisión, kernel trick, distancias de Minkowski. Demo: dibujá puntos y observá el clasificador.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "ml/naive-bayes.html",
        "class": "card-ml",
        "title": "Probabilidad: Clasificador Naive Bayes",
        "desc": "Probabilidad condicional y Teorema de Bayes. Demo: Filtro anti-spam interactivo con vocabularios.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "estadística" }
        ]
      },
      {
        "url": "ml/arboles-decision.html",
        "class": "card-ml",
        "title": "Árboles de Decisión & Random Forest",
        "desc": "Entropía, ganancia de información, bagging, feature importance. Demo: árbol que crece en vivo.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "ml/gradient-boosting.html",
        "class": "card-ml",
        "title": "Métodos Ensemble: Gradient Boosting & XGBoost",
        "desc": "Árboles débiles sumados en cascada para corregir residuos. Demo: Ajuste secuencial de curva 2D.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "ml/bias-variance.html",
        "class": "card-ml",
        "title": "Bias–Variance, Overfitting & Regularización",
        "desc": "Trade-off bias/varianza, L1 (Lasso), L2 (Ridge), cross-validation. Demo: deslizá la complejidad del modelo.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "estadística" }
        ]
      }
    ]
  },
  {
    "labelClass": "nn-label",
    "labelText": "Área 3 — Redes Neuronales",
    "title": "Del Perceptrón a las MLP",
    "desc": "De la neurona biológica al backpropagation. El bloque constructivo de todo lo que sigue.",
    "modules": [
      {
        "url": "nn/perceptron-activacion.html",
        "class": "card-nn",
        "title": "El Perceptrón & Funciones de Activación",
        "desc": "Pesos, bias, step / sigmoid / ReLU / tanh. Demo: perceptrón que aprende AND y OR, visualización de pesos.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "nn/multlayer-perceptron.html",
        "class": "card-nn",
        "title": "MLP & Forward Propagation",
        "desc": "Capas ocultas, transformaciones afines, composición de funciones. Demo: propagá un input capa a capa.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra lineal" }
        ]
      },
      {
        "url": "nn/backpropagation.html",
        "class": "card-nn",
        "title": "Backpropagation & Regla de la Cadena",
        "desc": "Grafo computacional, gradientes, chain rule, $\\partial L/\\partial w$. Demo: flujo de gradientes hacia atrás.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "cálculo" }
        ]
      },
      {
        "url": "nn/optimizadores-sgd.html",
        "class": "card-nn",
        "title": "Optimizadores: SGD, Momentum & Adam",
        "desc": "Superficies de pérdida, saddle points, momentos de primer y segundo orden. Demo: compará optimizadores en vivo.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "optimización" }
        ]
      },
      {
        "url": "nn/paisajes-perdida.html",
        "class": "card-nn",
        "title": "Paisajes de Pérdida & Saddle Points",
        "desc": "Mesetas multidimensionales. Demo: Contornos 2D donde SGD se atasca y Adam escapa.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      }
    ]
  },
  {
    "labelClass": "dl-label",
    "labelText": "Área 4 — Deep Learning",
    "title": "Arquitecturas Profundas",
    "desc": "CNNs, RNNs, embeddings y atención. Cómo las redes profundas procesan imágenes, texto y secuencias.",
    "modules": [
      {
        "url": "dl/redes-convolucionales.html",
        "class": "card-dl",
        "title": "Redes Convolucionales (CNN)",
        "desc": "Convolución discreta, pooling, receptive field, feature maps. Demo: kernel que detecta bordes en una imagen.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "dl/redes-recurrentes.html",
        "class": "card-dl",
        "title": "RNN, LSTM & GRU",
        "desc": "Memoria recurrente, vanishing gradients, puertas de olvido/entrada/salida. Demo: predicción de serie temporal.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "dl/word-embeddings.html",
        "class": "card-dl",
        "title": "Embeddings & Representaciones Vectoriales",
        "desc": "Word2Vec, similitud coseno, espacio latente, analogías. Demo: explorá relaciones semánticas en 2D.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "dl/mecanismo-atencion.html",
        "class": "card-dl",
        "title": "Mecanismo de Atención",
        "desc": "Queries, keys, values, scaled dot-product, softmax. El puente directo al Transformer.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "dl/modelos-generativos.html",
        "class": "card-dl",
        "title": "Modelado Generativo: Autoencoders & GANs",
        "desc": "Espacio latente, cuellos de botella, decodificación. Demo: Controla un espacio latente de rostros (5x5).",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      }
    ]
  },
  {
    "labelClass": "llm-label",
    "labelText": "Área 5 — LLMs",
    "title": "Grandes Modelos de Lenguaje",
    "desc": "La arquitectura Transformer completa, tokenización, pretraining, RLHF y el estado del arte.",
    "modules": [
      {
        "url": "llm/arquitectura-transformer.html",
        "class": "card-llm",
        "title": "La Arquitectura Transformer",
        "desc": "Multi-head self-attention, positional encoding, encoder/decoder, layer norm. Demo: flujo de un token.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "llm/tokenizacion-vocabulario.html",
        "class": "card-llm",
        "title": "Tokenización & Vocabulario",
        "desc": "BPE, WordPiece, SentencePiece, vocabulario de 50K tokens. Demo: tokenizá texto y ve los IDs en tiempo real.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-code", "text": "código" }
        ]
      },
      {
        "url": "llm/pretraining-fine-tuning.html",
        "class": "card-llm",
        "title": "Pretraining, Fine-tuning & RLHF",
        "desc": "Modelado de lenguaje causal, instruction tuning, reward model, PPO. El pipeline completo de GPT/Claude.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "probabilidad" }
        ]
      },
      {
        "url": "llm/generacion-parametros.html",
        "class": "card-llm",
        "title": "Generación: Temperature, Top-p & Beam Search",
        "desc": "Distribuciones sobre vocabulario, sampling, greedy vs. estocástico. Demo: generá con distintos parámetros.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "probabilidad" }
        ]
      },
      {
        "url": "llm/leyes-escala.html",
        "class": "card-llm",
        "title": "Leyes de Escala & Capacidades Emergentes",
        "desc": "Chinchilla scaling laws, in-context learning, chain-of-thought. Demo: curvas de pérdida interactivas.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "estadística" }
        ]
      },
      {
        "url": "llm/arquitecturas-actuales.html",
        "class": "card-llm",
        "title": "Arquitecturas Actuales: GPT, Llama, Claude",
        "desc": "KV-cache, Flash Attention, GQA, MoE, RoPE. Comparativa técnica del estado del arte.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-code", "text": "técnico" }
        ]
      },
      {
        "url": "llm/retrieval-augmented-generation.html",
        "class": "card-llm",
        "title": "RAG (Retrieval-Augmented Generation)",
        "desc": "Bases de datos vectoriales, similitud semántica, inyección de contexto. Demo: Pipeline RAG en tiempo real.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-visual", "text": "visual" }
        ]
      },
      {
        "url": "llm/agentes-herramientas.html",
        "class": "card-llm",
        "title": "LLM Agénticos: Tool Use, Planning y Orquestación",
        "desc": "De chatbots a agentes: planificación, uso de herramientas y control de errores con un modelo formal costo-riesgo.",
        "tags": [
          { "class": "tag-interactive", "text": "agentes" },
          { "class": "tag-code", "text": "tool-use" }
        ]
      }
    ]
  },
  {
    "labelClass": "ga-label",
    "labelText": "Área 6 — Algoritmos Genéticos",
    "title": "Computación Evolutiva",
    "desc": "Optimización inspirada en la selección natural. Poblaciones, mutación, cruce y fitness. Sin gradientes.",
    "modules": [
      {
        "url": "ga/fundamentos-geneticos.html",
        "class": "card-ga",
        "title": "Fundamentos: Cromosomas, Fitness & Selección",
        "desc": "Representación binaria y real, función de aptitud, ruleta y torneo. Demo: evolución en tiempo real sobre una función.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "evolutivo" }
        ]
      },
      {
        "url": "ga/operadores-geneticos.html",
        "class": "card-ga",
        "title": "Operadores: Cruce, Mutación & Elitismo",
        "desc": "Single/multi-point crossover, tasa de mutación, elitismo. Demo: observá cómo los genes se mezclan generación a generación.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-bio", "text": "evolutivo" }
        ]
      },
      {
        "url": "ga/aplicaciones-geneticas.html",
        "class": "card-ga",
        "title": "Aplicaciones: TSP, Neuroevolución & NEAT",
        "desc": "Traveling Salesman Problem, evolución de pesos neurales, topología adaptativa. Demo: GA resolviendo el TSP.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "aplicado" }
        ]
      },
      {
        "url": "ga/evolucion-vs-gradiente.html",
        "class": "card-ga",
        "title": "GA vs. Gradiente & Espacios No Diferenciables",
        "desc": "Cuándo usar evolución vs. backprop, paisajes de fitness rugosos, black-box optimization.",
        "tags": [
          { "class": "tag-math", "text": "comparativa" },
          { "class": "tag-bio", "text": "teoría" }
        ]
      },
      {
        "url": "ga/neuroevolucion-neat.html",
        "class": "card-ga",
        "title": "Neuroevolución: Topologías NEAT",
        "desc": "Redes neuronales que crecen nodos and conexiones. Demo: Evolución estructural de una red.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "evolutivo" }
        ]
      }
    ]
  },
  {
    "labelClass": "qc-label",
    "labelText": "Área 7 — Computación Cuántica",
    "title": "Quantum Computing & QML",
    "desc": "Qubits, puertas cuánticas, algoritmos cuánticos y su intersección con el machine learning.",
    "modules": [
      {
        "url": "qc/fundamentos-cuanticos.html",
        "class": "card-qc",
        "title": "Qubits, Superposición & Entrelazamiento",
        "desc": "Esfera de Bloch, braket notation $|\psi\rangle$, superposición y entrelazamiento EPR. Demo: qubit interactivo en esfera de Bloch.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-quantum", "text": "cuántico" }
        ]
      },
      {
        "url": "qc/puertas-cuanticas.html",
        "class": "card-qc",
        "title": "Puertas Cuánticas & Circuitos",
        "desc": "Hadamard, CNOT, Pauli X/Y/Z, matrices unitarias, reversibilidad. Demo: constructor de circuitos cuánticos.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-math", "text": "álgebra" }
        ]
      },
      {
        "url": "qc/entrelazamiento-bell.html",
        "class": "card-qc",
        "title": "Entrelazamiento & Estados de Bell",
        "desc": "Sistemas multi-qubit, puertas CNOT y acción a distancia. Demo: Circuito cuántico de 2 Qubits.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-quantum", "text": "cuántico" }
        ]
      },
      {
        "url": "qc/algoritmos-cuanticos.html",
        "class": "card-qc",
        "title": "Algoritmos Cuánticos: Grover & Shor",
        "desc": "Búsqueda cuántica $O(\sqrt{N})$, factorización en tiempo polinomial, QFT. Implicaciones para criptografía.",
        "tags": [
          { "class": "tag-quantum", "text": "cuántico" },
          { "class": "tag-math", "text": "algoritmos" }
        ]
      },
      {
        "url": "qc/quantum-machine-learning.html",
        "class": "card-qc",
        "title": "Quantum Machine Learning (QML)",
        "desc": "Variational quantum circuits, quantum kernels, VQE, QAOA. La frontera entre QC y ML clásico.",
        "tags": [
          { "class": "tag-quantum", "text": "cuántico" },
          { "class": "tag-math", "text": "avanzado" }
        ]
      }
    ]
  },
  {
    "labelClass": "rl-label",
    "labelText": "Área 8 — Reinforcement Learning",
    "title": "Aprendizaje por Refuerzo",
    "desc": "Agentes que aprenden mediante recompensas y castigos en entornos dinámicos.",
    "modules": [
      {
        "url": "rl/q-learning.html",
        "class": "card-ml",
        "title": "Q-Learning & MDPs",
        "desc": "Estados, acciones, recompensas y la ecuación de Bellman. Demo: Agente que aprende a salir de un laberinto.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-math", "text": "algoritmos" }
        ]
      }
    ]
  },
  {
    "labelClass": "bio-label",
    "labelText": "Área 9 — Neurociencia Computacional",
    "title": "IA Bioinspirada",
    "desc": "Modelos que replican la arquitectura real del cerebro humano. Redes pulsantes, tálamo e hipocampo.",
    "modules": [
      {
        "url": "bio/redes-pulsantes.html",
        "class": "card-nn",
        "title": "Redes Neuronales Pulsantes (SNN)",
        "desc": "El modelo LIF (Leaky Integrate-and-Fire). Demo: Inyecta corriente a una neurona y observa los \"spikes\".",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "bio" }
        ]
      },
      {
        "url": "bio/jerarquia-cortical.html",
        "class": "card-nn",
        "title": "Jerarquía Cortical y Microcolumnas",
        "desc": "Capas L4, L2/3, L5 y flujo V1→IT→PFC. Demo: Flujo jerárquico visual.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-bio", "text": "bio" }
        ]
      },
      {
        "url": "bio/talamo-atencion.html",
        "class": "card-nn",
        "title": "Tálamo y Atención Selectiva",
        "desc": "Núcleos LGN y TRN como filtro de información. Demo: Gating atencional de estímulos sensoriales.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "bio" }
        ]
      },
      {
        "url": "bio/hipocampo-memoria.html",
        "class": "card-nn",
        "title": "Hipocampo y Memoria Episódica",
        "desc": "Separación (DG) y Completación (CA3) de patrones. Demo: Recuperación de memoria con claves parciales.",
        "tags": [
          { "class": "tag-interactive", "text": "interactivo" },
          { "class": "tag-bio", "text": "bio" }
        ]
      },
      {
        "url": "bio/neocortex-consolidacion.html",
        "class": "card-nn",
        "title": "Neocórtex y Consolidación (Sueño)",
        "desc": "Transferencia de memorias del Hipocampo al Neocórtex a largo plazo (Replay nocturno). Demo: Consolidación offline a base de datos.",
        "tags": [
          { "class": "tag-visual", "text": "visual" },
          { "class": "tag-bio", "text": "bio" }
        ]
      }
    ]
  }
];
