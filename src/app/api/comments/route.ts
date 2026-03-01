import { NextResponse } from "next/server";
import { createComment, listComments } from "@/lib/comments-neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const comments = await listComments();
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json(
      { error: "评论服务暂不可用，请稍后重试。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; content?: string };
    const comment = await createComment(body.name ?? "", body.content ?? "");

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "name_and_content_required") {
        return NextResponse.json(
          { error: "请填写姓名和评论内容。" },
          { status: 400 },
        );
      }

      if (error.message === "name_too_long") {
        return NextResponse.json(
          { error: "姓名不能超过 40 个字符。" },
          { status: 400 },
        );
      }

      if (error.message === "content_too_long") {
        return NextResponse.json(
          { error: "评论内容不能超过 1000 个字符。" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "提交失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
