"""
NextDevKit 文档爬虫
使用 crawl4ai 递归爬取 https://nextdevkit.com/zh/docs 的所有文档页面
"""

import asyncio
import os
import re
from urllib.parse import urljoin, urlparse
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

# 配置
BASE_URL = "https://nextdevkit.com/zh/docs"
DOMAIN = "nextdevkit.com"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

# 存储已访问的URL
visited_urls = set()
# 存储待访问的URL
pending_urls = set()


def sanitize_filename(url: str) -> str:
    """将URL转换为安全的文件名"""
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return "index"
    # 替换路径分隔符为下划线
    filename = path.replace("/", "_")
    # 移除不安全字符
    filename = re.sub(r'[<>:"|?*]', '', filename)
    return filename


def is_valid_doc_url(url: str) -> bool:
    """检查URL是否为有效的文档页面"""
    parsed = urlparse(url)
    # 必须是同一域名
    if DOMAIN not in parsed.netloc:
        return False
    # 必须是 /zh/docs 路径下的页面
    if not parsed.path.startswith("/zh/docs"):
        return False
    # 排除锚点和查询参数变体
    return True


def extract_links(markdown_content: str, base_url: str) -> set:
    """从markdown内容中提取链接"""
    links = set()
    # 匹配markdown链接 [text](url)
    md_link_pattern = r'\[([^\]]*)\]\(([^)]+)\)'
    for match in re.finditer(md_link_pattern, markdown_content):
        url = match.group(2)
        # 处理相对链接
        if url.startswith("/"):
            url = f"https://{DOMAIN}{url}"
        elif not url.startswith("http"):
            url = urljoin(base_url, url)
        # 移除锚点
        url = url.split("#")[0]
        if is_valid_doc_url(url):
            links.add(url)
    return links


async def crawl_page(crawler: AsyncWebCrawler, url: str, config: CrawlerRunConfig) -> tuple:
    """爬取单个页面"""
    try:
        result = await crawler.arun(url=url, config=config)
        if result.success:
            return result.markdown, result.html
        else:
            print(f"  [失败] {url}: {result.error_message}")
            return None, None
    except Exception as e:
        print(f"  [错误] {url}: {e}")
        return None, None


async def main():
    """主函数"""
    print("=" * 60)
    print("NextDevKit 文档爬虫")
    print("=" * 60)

    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 配置浏览器
    browser_config = BrowserConfig(
        headless=True,
        verbose=False
    )

    # 配置爬取参数
    crawler_config = CrawlerRunConfig(
        word_count_threshold=10,
        exclude_external_links=True,
        remove_overlay_elements=True,
    )

    # 初始化待爬取URL
    pending_urls.add(BASE_URL)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        page_count = 0

        while pending_urls:
            url = pending_urls.pop()

            if url in visited_urls:
                continue

            visited_urls.add(url)
            page_count += 1

            print(f"\n[{page_count}] 正在爬取: {url}")

            markdown, html = await crawl_page(crawler, url, crawler_config)

            if markdown:
                # 保存markdown文件
                filename = sanitize_filename(url) + ".md"
                filepath = os.path.join(OUTPUT_DIR, filename)

                # 添加页面标题和URL信息
                header = f"# 来源: {url}\n\n---\n\n"
                content = header + markdown

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  [保存] {filename}")

                # 提取并添加新链接
                new_links = extract_links(markdown, url)
                for link in new_links:
                    if link not in visited_urls:
                        pending_urls.add(link)

                if new_links:
                    print(f"  [发现] {len(new_links)} 个新链接")

    print("\n" + "=" * 60)
    print(f"爬取完成! 共爬取 {page_count} 个页面")
    print(f"文件保存在: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
