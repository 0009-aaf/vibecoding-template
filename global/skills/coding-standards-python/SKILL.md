---
name: coding-standards-python
description: Python 编码规范（9 条）。Agent 操作 .py 文件时自动加载。包含类型注解、Ruff、Mypy、Bandit、pyproject.toml 配置规则。从 coding-standards §6.2 拆出。
---

# Python 编码规范

> 从 coding-standards v1.8 §6.2 拆出。通用规则见 `coding-standards` skill。

| # | 规则 |
|---|------|
| PY1 | 类型注解：所有公开函数参数+返回值 |
| PY2 | Ruff 格式化 + lint（规则集：E/F/B/UP/SIM/TC），提交前通过 |
| PY3 | 不使用可变默认参数 (`def f(lst=[])`) |
| PY4 | `with` 语句管理资源（文件/连接/锁） |
| PY5 | 列表推导优先于 `map`/`filter`，但不超过一层嵌套 |
| PY6 | Mypy 在 CI 中运行：`warn_return_any` + `no_implicit_optional` + `disallow_untyped_defs` |
| PY7 | 新增代码 Mypy `--strict` 通过后才可合入 |
| PY8 | Bandit 安全扫描 CI 中启用（`bandit -r src/ -ll`） |
| PY9 | `pyproject.toml` 统一配置所有工具，禁止散落的 `.ini`/`.cfg` |

## Python 自检清单（提交前过一遍）

```
□ 所有公开函数有类型注解？               -> PY1
□ Ruff lint 通过了？                     -> PY2
□ Mypy --strict 通过了？                 -> PY6 PY7
□ Bandit 扫描通过？                      -> PY8
□ pyproject.toml 统一配置？              -> PY9
```
