"use client";
import React, { useState, useRef, useCallback } from "react";
import { Asset, AssetPrompt, getTypeLabel } from "@/lib/types";
import styles from "./page.module.css";

// =============================================
// Types
// =============================================
type Phase = "upload" | "analyzing" | "review" | "generating" | "prompts";

// =============================================
// Helper Components
// =============================================
function Spinner({ size = 20 }: { size?: number }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                border: `${Math.max(2, size / 10)}px solid rgba(255,255,255,0.1)`,
                borderTopColor: "var(--accent-blue)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
            }}
        />
    );
}

function Badge({ type }: { type: string }) {
    const cls =
        type === "character"
            ? "badge-character"
            : type === "scene"
                ? "badge-scene"
                : type === "prop"
                    ? "badge-prop"
                    : "badge-variant";
    return <span className={`badge ${cls}`}>{getTypeLabel(type as never)}</span>;
}

function Stars({ n }: { n: number }) {
    return (
        <span className="stars">
            {"★".repeat(n)}
            <span style={{ opacity: 0.25 }}>{"★".repeat(5 - n)}</span>
        </span>
    );
}

// =============================================
// Upload Phase
// =============================================
function UploadPhase({ onFile }: { onFile: (f: File) => void }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
        },
        [onFile]
    );

    return (
        <div className={styles.uploadWrap}>
            <div className={styles.heroTag}>
                <span className={styles.dot} style={{ background: "var(--accent-blue)" }} />
                <span>AI 剧本资产统筹系统</span>
            </div>

            <h1 className={styles.heroTitle}>
                上传剧本
                <br />
                <span className={styles.heroAccent}>自动梳理所有美术资产</span>
            </h1>
            <p className={styles.heroSub}>
                两个 AI Agent 协作：资产统筹 + 美术专家，生成完整的提示词表格
            </p>

            <div
                className={`${styles.dropzone} ${dragging ? styles.dropzoneDrag : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                id="upload-dropzone"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".docx,.doc"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                    id="file-input"
                />
                <div className={styles.dropzoneIcon}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <polyline points="9 15 12 12 15 15" />
                    </svg>
                </div>
                <p className={styles.dropzoneTitle}>
                    {dragging ? "松开以上传" : "拖拽剧本至此，或点击选择文件"}
                </p>
                <p className={styles.dropzoneSub}>支持 .docx 格式</p>
            </div>

            {/* Feature pills */}
            <div className={styles.featurePills}>
                {[
                    { color: "var(--accent-blue)", label: "人物资产" },
                    { color: "var(--accent-cyan)", label: "场景资产" },
                    { color: "var(--accent-amber)", label: "道具资产" },
                    { color: "var(--accent-pink)", label: "变体识别" },
                    { color: "var(--accent-purple)", label: "提示词生成" },
                    { color: "var(--accent-green)", label: "Excel 导出" },
                ].map((f) => (
                    <div key={f.label} className="tag">
                        <span
                            className="glow-dot"
                            style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }}
                        />
                        {f.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================
// Analyzing / Generating Phase
// =============================================
function LoadingPhase({ phase, filename }: { phase: Phase; filename: string }) {
    const isAnalyzing = phase === "analyzing";
    return (
        <div className={styles.loadingWrap}>
            <div className={styles.loadingCard}>
                <div className={styles.loadingIconWrap}>
                    <Spinner size={48} />
                </div>
                <h2 className={styles.loadingTitle}>
                    {isAnalyzing ? "资产统筹 Agent 分析中…" : "美术专家 Agent 生成提示词…"}
                </h2>
                <p className={styles.loadingSub}>
                    {isAnalyzing
                        ? `正在阅读《${filename}》，识别人物、场景、道具及其变体`
                        : "正在为每个资产的每个图片规格生成中文提示词"}
                </p>
                <div className={styles.loadingSteps}>
                    {isAnalyzing ? (
                        <>
                            <LoadingStep done icon="📄" label={`已解析文档：${filename}`} />
                            <LoadingStep active icon="🤖" label="Agent 1：资产统筹" />
                            <LoadingStep icon="🎨" label="Agent 2：美学提示词" />
                        </>
                    ) : (
                        <>
                            <LoadingStep done icon="📄" label={`已解析文档：${filename}`} />
                            <LoadingStep done icon="🤖" label="Agent 1：资产统筹 完成" />
                            <LoadingStep active icon="🎨" label="Agent 2：美学提示词" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingStep({ icon, label, done, active }: { icon: string; label: string; done?: boolean; active?: boolean }) {
    return (
        <div className={`${styles.loadingStep} ${done ? styles.stepDone : active ? styles.stepActive : ""}`}>
            <span>{icon}</span>
            <span>{label}</span>
            {done && <span style={{ marginLeft: "auto", color: "var(--accent-green)" }}>✓</span>}
            {active && <Spinner size={14} />}
        </div>
    );
}

// =============================================
// Asset Table (Review Phase)
// =============================================
function ReviewPhase({
    assets,
    filename,
    onConfirm,
    onReset,
}: {
    assets: Asset[];
    filename: string;
    onConfirm: () => void;
    onReset: () => void;
}) {
    const [tab, setTab] = useState<"all" | "character" | "scene" | "prop">("all");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const filtered =
        tab === "all" ? assets : assets.filter((a) => a.type === tab);

    const counts = {
        character: assets.filter((a) => a.type === "character" && !a.isVariant).length,
        scene: assets.filter((a) => a.type === "scene" && !a.isVariant).length,
        prop: assets.filter((a) => a.type === "prop" && !a.isVariant).length,
    };

    const toggleRow = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className={styles.reviewWrap}>
            {/* Header */}
            <div className={styles.reviewHeader}>
                <div>
                    <div className="section-label" style={{ marginBottom: 6 }}>
                        Agent 1 · 资产统筹完成
                    </div>
                    <h2 className={styles.reviewTitle}>
                        已识别 {assets.length} 个资产条目
                    </h2>
                    <p className={styles.reviewSub}>来源：{filename}</p>
                </div>
                <div className={styles.reviewActions}>
                    <button className="btn btn-ghost" onClick={onReset}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                        </svg>
                        重新上传
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} id="confirm-btn">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12l5 5L20 7" />
                        </svg>
                        确认并生成提示词
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                {[
                    { label: "人物", count: counts.character, color: "var(--accent-blue)" },
                    { label: "场景", count: counts.scene, color: "var(--accent-cyan)" },
                    { label: "道具", count: counts.prop, color: "var(--accent-amber)" },
                    { label: "变体", count: assets.filter(a => a.isVariant).length, color: "var(--accent-purple)" },
                ].map((s) => (
                    <div key={s.label} className={`glass-card ${styles.statCard}`}>
                        <div className={styles.statNum} style={{ color: s.color }}>
                            {s.count}
                        </div>
                        <div className={styles.statLabel}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className={styles.tabRow}>
                {(["all", "character", "scene", "prop"] as const).map((t) => (
                    <button
                        key={t}
                        className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === "all" ? `全部 (${assets.length})` :
                            t === "character" ? `人物 (${assets.filter(a => a.type === "character").length})` :
                                t === "scene" ? `场景 (${assets.filter(a => a.type === "scene").length})` :
                                    `道具 (${assets.filter(a => a.type === "prop").length})`}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>编号</th>
                            <th>类型</th>
                            <th>名称</th>
                            <th style={{ width: "35%" }}>简要介绍</th>
                            <th>出场集数</th>
                            <th>重要程度</th>
                            <th>图片规格</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((asset) => {
                            const isOpen = expanded.has(asset.id);
                            return (
                                <React.Fragment key={asset.id}>
                                    <tr
                                        className={`${styles.tableRow} ${asset.isVariant ? styles.variantRow : ""}`}
                                        onClick={() => toggleRow(asset.id)}
                                    >
                                        <td>
                                            <span className={styles.assetId}>{asset.id}</span>
                                            {asset.isVariant && (
                                                <span className="badge badge-variant" style={{ marginLeft: 4, fontSize: 10 }}>
                                                    变体
                                                </span>
                                            )}
                                        </td>
                                        <td><Badge type={asset.type} /></td>
                                        <td className={styles.assetName}>{asset.name}</td>
                                        <td className={styles.assetDesc}>{asset.briefDescription}</td>
                                        <td><span className="tag">{asset.episodes}</span></td>
                                        <td><Stars n={asset.importance} /></td>
                                        <td>
                                            <div className={styles.specList}>
                                                {asset.specs.map((s) => (
                                                    <span key={s.name} className={styles.specPill}>
                                                        {s.name}
                                                        <span className={styles.specRatio}>{s.ratio}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                    {isOpen && (
                                        <tr>
                                            <td colSpan={7} className={styles.expandedCell}>
                                                <div className={styles.expandedContent}>
                                                    <div className="section-label" style={{ marginBottom: 8 }}>图片规格详情</div>
                                                    <div className={styles.specGrid}>
                                                        {asset.specs.map((s) => (
                                                            <div key={s.name} className={`glass-card ${styles.specCard}`}>
                                                                <div className={styles.specCardRatio}>{s.ratio}</div>
                                                                <div className={styles.specCardName}>{s.name}</div>
                                                                <div className={styles.specCardDesc}>{s.description}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Confirm bar */}
            <div className={styles.confirmBar}>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    确认资产列表无误后，点击按钮调用美术专家 Agent 生成提示词
                </p>
                <button className="btn btn-primary" onClick={onConfirm}>
                    确认并生成提示词 →
                </button>
            </div>
        </div>
    );
}

// =============================================
// Prompts Phase
// =============================================
function PromptsPhase({
    assets,
    prompts,
    styleDescription,
    onExport,
    onReset,
    exporting,
}: {
    assets: Asset[];
    prompts: AssetPrompt[];
    styleDescription: string;
    onExport: () => void;
    onReset: () => void;
    exporting: boolean;
}) {
    const [openId, setOpenId] = useState<string | null>(assets[0]?.id ?? null);
    const [copied, setCopied] = useState<string | null>(null);

    const groupedByAsset = assets.map((asset) => ({
        asset,
        prompts: prompts.filter((p) => p.assetId === asset.id),
    }));

    const copyPrompt = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        });
    };

    return (
        <div className={styles.promptsWrap}>
            {/* Header */}
            <div className={styles.reviewHeader}>
                <div>
                    <div className="section-label" style={{ marginBottom: 6 }}>
                        Agent 2 · 美术专家完成
                    </div>
                    <h2 className={styles.reviewTitle}>
                        提示词生成完毕 · {prompts.length} 条
                    </h2>
                </div>
                <div className={styles.reviewActions}>
                    <button className="btn btn-ghost" onClick={onReset}>重新开始</button>
                    <button
                        className="btn btn-success"
                        onClick={onExport}
                        disabled={exporting}
                        id="export-btn"
                    >
                        {exporting ? <Spinner size={14} /> : (
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        )}
                        {exporting ? "导出中…" : "下载 Excel"}
                    </button>
                </div>
            </div>

            {/* Style card */}
            {styleDescription && (
                <div className={`glass-card ${styles.styleCard}`}>
                    <div className={styles.styleCardLabel}>
                        <span className="glow-dot" style={{ background: "var(--accent-pink)", boxShadow: "0 0 8px var(--accent-pink)" }} />
                        统一美学风格描述
                    </div>
                    <p className={styles.styleCardText}>{styleDescription}</p>
                </div>
            )}

            {/* Asset accordion */}
            <div className={styles.accordionList}>
                {groupedByAsset.map(({ asset, prompts: aPrompts }) => (
                    <div
                        key={asset.id}
                        className={`glass-card ${styles.accordion} ${openId === asset.id ? styles.accordionOpen : ""}`}
                    >
                        <button
                            className={styles.accordionHeader}
                            onClick={() => setOpenId(openId === asset.id ? null : asset.id)}
                        >
                            <span className={styles.assetId}>{asset.id}</span>
                            <Badge type={asset.type} />
                            <span className={styles.accordionName}>{asset.name}</span>
                            {asset.isVariant && <span className="badge badge-variant">变体</span>}
                            <Stars n={asset.importance} />
                            <span className={styles.accordionCount}>{aPrompts.length} 条提示词</span>
                            <svg
                                className={styles.chevron}
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                style={{ transform: openId === asset.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {openId === asset.id && (
                            <div className={styles.accordionBody}>
                                <p className={styles.accordionDesc}>{asset.briefDescription}</p>
                                <div className={styles.promptGrid}>
                                    {aPrompts.map((p) => {
                                        const key = `${p.assetId}-${p.specName}`;
                                        const spec = asset.specs.find(s => s.name === p.specName);
                                        return (
                                            <div key={key} className={`glass-card ${styles.promptCard}`}>
                                                <div className={styles.promptCardHead}>
                                                    <span className={styles.promptSpecName}>{p.specName}</span>
                                                    {spec && <span className={styles.promptRatio}>{spec.ratio}</span>}
                                                    <button
                                                        className={`btn btn-ghost ${styles.copyBtn}`}
                                                        onClick={() => copyPrompt(p.fullPrompt, key)}
                                                    >
                                                        {copied === key ? (
                                                            <svg width="12" height="12" fill="none" stroke="var(--accent-green)" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                                                        ) : (
                                                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                            </svg>
                                                        )}
                                                        {copied === key ? "已复制" : "复制"}
                                                    </button>
                                                </div>

                                                <div className={styles.promptSection}>
                                                    <div className="section-label" style={{ color: "var(--accent-blue)", marginBottom: 4 }}>外观描述</div>
                                                    <p className={styles.promptText}>{p.appearance}</p>
                                                </div>
                                                <div className={styles.promptSection}>
                                                    <div className="section-label" style={{ color: "var(--accent-pink)", marginBottom: 4 }}>美学风格</div>
                                                    <p className={styles.promptText}>{p.style}</p>
                                                </div>
                                                <div className={styles.promptSection}>
                                                    <div className="section-label" style={{ color: "var(--accent-amber)", marginBottom: 4 }}>规格控制</div>
                                                    <p className={styles.promptText}>{p.spec}</p>
                                                </div>

                                                <div className={styles.fullPromptWrap}>
                                                    <div className="section-label" style={{ color: "var(--accent-green)", marginBottom: 6 }}>完整提示词</div>
                                                    <p className={styles.fullPromptText}>{p.fullPrompt}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {aPrompts.length === 0 && (
                                        <p style={{ color: "var(--text-muted)", fontSize: 12, gridColumn: "1/-1", padding: 16 }}>
                                            此资产暂无提示词（API未返回）
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================
// Error Banner
// =============================================
function ErrorBanner({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
    return (
        <div className={styles.errorBanner}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ flex: 1 }}>{msg}</span>
            <button className={styles.errorClose} onClick={onDismiss}>✕</button>
        </div>
    );
}

// =============================================
// Main Page
// =============================================
export default function Home() {
    const [phase, setPhase] = useState<Phase>("upload");
    const [filename, setFilename] = useState("");
    const [scriptText, setScriptText] = useState("");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [prompts, setPrompts] = useState<AssetPrompt[]>([]);
    const [styleDesc, setStyleDesc] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const handleReset = () => {
        setPhase("upload");
        setFilename("");
        setScriptText("");
        setAssets([]);
        setPrompts([]);
        setStyleDesc("");
        setError(null);
    };

    // Step 1: Upload and parse
    const handleFile = async (file: File) => {
        setError(null);
        setFilename(file.name);
        setPhase("analyzing");

        try {
            // Parse docx
            const form = new FormData();
            form.append("file", file);
            const parseRes = await fetch("/api/parse-script", { method: "POST", body: form });
            const parseData = await parseRes.json();
            if (!parseRes.ok) throw new Error(parseData.error || "解析失败");

            const text: string = parseData.text;
            setScriptText(text);

            // Agent 1
            const a1Res = await fetch("/api/agent1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scriptText: text }),
            });
            const a1Data = await a1Res.json();
            if (!a1Res.ok) throw new Error(a1Data.error || "Agent 1 失败");

            setAssets(a1Data.assets);
            setPhase("review");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setPhase("upload");
        }
    };

    // Step 2: Confirm and run Agent 2
    const handleConfirm = async () => {
        setError(null);
        setPhase("generating");

        try {
            const a2Res = await fetch("/api/agent2", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scriptText, assets }),
            });
            const a2Data = await a2Res.json();
            if (!a2Res.ok) throw new Error(a2Data.error || "Agent 2 失败");

            setPrompts(a2Data.prompts || []);
            setStyleDesc(a2Data.styleDescription || "");
            setPhase("prompts");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setPhase("review");
        }
    };

    // Step 3: Export Excel
    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assets, prompts, styleDescription: styleDesc }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "导出失败");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "剧本资产统筹表.xlsx";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setExporting(false);
        }
    };

    return (
        <main className={styles.main}>
            {/* Ambient glow blobs */}
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />

            {/* Top nav */}
            <nav className={styles.nav}>
                <div className={styles.navLogo}>
                    <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>S</span>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>→</span>
                    <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>A</span>
                    <span style={{ marginLeft: 8, color: "var(--text-secondary)", fontSize: 12 }}>
                        Script to Assets
                    </span>
                </div>
                <div className={styles.navSteps}>
                    {[
                        { key: "upload", label: "01 上传" },
                        { key: "review", label: "02 确认" },
                        { key: "prompts", label: "03 提示词" },
                    ].map((s) => {
                        const active = phase === s.key || (s.key === "upload" && phase === "analyzing") || (s.key === "review" && phase === "generating");
                        const done =
                            (s.key === "upload" && ["review", "generating", "prompts"].includes(phase)) ||
                            (s.key === "review" && phase === "prompts");
                        return (
                            <div key={s.key} className={`${styles.navStep} ${active ? styles.navStepActive : ""} ${done ? styles.navStepDone : ""}`}>
                                {done && "✓ "}{s.label}
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Error */}
            {error && (
                <div className={styles.errorWrap}>
                    <ErrorBanner msg={error} onDismiss={() => setError(null)} />
                </div>
            )}

            {/* Phase content */}
            <div className={styles.content}>
                {(phase === "upload") && <UploadPhase onFile={handleFile} />}
                {(phase === "analyzing" || phase === "generating") && (
                    <LoadingPhase phase={phase} filename={filename} />
                )}
                {phase === "review" && (
                    <ReviewPhase
                        assets={assets}
                        filename={filename}
                        onConfirm={handleConfirm}
                        onReset={handleReset}
                    />
                )}
                {phase === "prompts" && (
                    <PromptsPhase
                        assets={assets}
                        prompts={prompts}
                        styleDescription={styleDesc}
                        onExport={handleExport}
                        onReset={handleReset}
                        exporting={exporting}
                    />
                )}
            </div>
        </main>
    );
}
