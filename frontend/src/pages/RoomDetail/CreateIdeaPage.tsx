import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { ideasApi } from '@/api/ideas';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const createIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().refine((val) => stripHtml(val).length >= 10, 'Description must be at least 10 characters'),
  summary: z.string().optional(),
});

type CreateIdeaForm = z.infer<typeof createIdeaSchema>;

export const CreateIdeaPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateIdeaForm>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: { description: '' },
  });

  const onSubmit = async (data: CreateIdeaForm) => {
    if (!roomId) return;
    try {
      const idea = await ideasApi.create({
        room_id: roomId,
        title: data.title,
        description: data.description,
        summary: data.summary || undefined,
      });
      showToast({ type: 'success', message: 'Idea created successfully!' });
      navigate(`/ideas/${idea.id}`);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const detail = Array.isArray(raw) ? raw.map((e: { msg?: string }) => e.msg).join(', ') : typeof raw === 'string' ? raw : 'Failed to create idea';
      showToast({ type: 'error', message: detail });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/rooms/${roomId}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Room
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Create New Idea</h1>
          <p className="text-gray-500 mt-1">Share your solution or suggestion for this brainstorming room.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Idea Title"
              placeholder="What is your idea? (min 3 characters)"
              {...register('title')}
              error={errors.title?.message}
            />

            <RichTextEditor
              label="Description"
              value={watch('description')}
              onChange={(html) => setValue('description', html, { shouldValidate: true })}
              placeholder="Describe your solution in detail... (min 10 characters)"
              error={errors.description?.message}
              minHeight="200px"
            />

            <Textarea
              label="Summary (optional)"
              placeholder="Brief summary of your idea (shown in listings)"
              rows={4}
              {...register('summary')}
              error={errors.summary?.message}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="ghost" onClick={() => navigate(`/rooms/${roomId}`)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Idea
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
