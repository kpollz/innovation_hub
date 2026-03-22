import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roomsApi } from '@/api/rooms';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  problem_id: z.string().optional(),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  onSuccess: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { problems, fetchProblems } = useProblemStore();
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createRoom';

  useEffect(() => {
    if (isOpen) {
      fetchProblems({ status: 'open', limit: 100 });
    }
  }, [isOpen, fetchProblems]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = async (data: CreateRoomForm) => {
    try {
      await roomsApi.create({
        name: data.name,
        description: data.description,
        problem_id: data.problem_id || undefined,
      });
      showToast({ type: 'success', message: t('rooms.created_success') });
      reset();
      closeModal();
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('rooms.create_error') });
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  const problemOptions = [
    { value: '', label: t('rooms.link_problem_option') },
    ...problems.map((p) => ({
      value: p.id,
      label: p.title,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('rooms.create_room_title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            {t('rooms.create_room')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('rooms.room_name_label')}
          placeholder={t('rooms.room_name_placeholder')}
          {...register('name')}
          error={errors.name?.message}
        />

        <Textarea
          label={t('rooms.desc_label')}
          placeholder={t('rooms.room_desc_placeholder')}
          rows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        <Select
          label={t('rooms.link_problem')}
          options={problemOptions}
          {...register('problem_id')}
        />
      </form>
    </Modal>
  );
};
