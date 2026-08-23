---
name: coding-standards-c
description: C 语言编码规范（8 条）。Agent 操作 .c/.h 文件时自动加载。包含安全函数、动态分配判空、资源释放、编译警告、整数溢出。从 coding-standards §6.5 拆出。
---

# C 语言编码规范

> 从 coding-standards v1.8 §6.5 拆出。通用规则见 `coding-standards` skill。

| # | 规则 |
|---|------|
| C1 | 所有 `scanf`/`gets`/`strcpy`/`strcat`/`sprintf` 用安全版本：`scanf_s`/`gets_s`/`strcpy_s`/`strcat_s`/`snprintf` |
| C2 | 动态分配后立即判空：`malloc`/`calloc` 返回值与 `NULL` 比较 |
| C3 | 每个 `malloc`/`fopen`/`CreateFile` 有对应的 `free`/`fclose`/`CloseHandle`，释放后指针置 `NULL` |
| C4 | 编译打开所有警告：`-Wall -Wextra -Werror`（GCC/MSVC 等效项） |
| C5 | 整数运算前检查溢出：加法 `a > INT_MAX - b`、乘法 `a > INT_MAX / b` |
| C6 | 数组/缓冲区索引用 `size_t`，禁止负数下标 |
| C7 | 宏参数全程加括号：`#define SQUARE(x) ((x) * (x))`，多语句宏用 `do { ... } while(0)` |
| C8 | 结构体指针参数如果不修改，用 `const` 修饰 |

## C 自检清单（提交前过一遍）

```
□ 危险函数都换成了安全版本？             -> C1
□ malloc 返回值判空了？                   -> C2
□ 每个 malloc 有对应 free？               -> C3
□ -Wall -Wextra -Werror 开了？           -> C4
□ 整数运算检查溢出了？                   -> C5
□ 宏参数全程加括号？                     -> C7
```
