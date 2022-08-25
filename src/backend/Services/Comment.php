<?php

namespace Espo\Modules\Comments\Services;

use Espo\Core\{
    Exceptions\Forbidden,
    Exceptions\ForbiddenSilent,
    Exceptions\NotFound,
    Record\Collection as RecordCollection,
    Select\SearchParams
};
use Espo\ORM\Entity;

class Comment extends \Espo\Core\Templates\Services\Base
{
    /**
     * @throws Forbidden
     */
    public function findForEntity(string $scope, string $id, SearchParams $searchParams): RecordCollection
    {
        $entity = $this->entityManager->getEntity($scope, $id);

        if (!$this->acl->checkEntity($entity, 'stream')) {
            throw new Forbidden();
        }

        $additionalSearchParams = SearchParams::fromRaw([
            'where' => [
                [
                    'field' => 'parentType',
                    'type' => 'equals',
                    'value' => $scope,
                ],
                [
                    'field' => 'parentId',
                    'type' => 'equals',
                    'value' => $id,
                ],
                [
                    'field' => 'commentReplyId',
                    'type' => 'isNull',
                ],
            ],
        ]);

        $preparedSearchParams = $this->prepareSearchParams(SearchParams::merge($searchParams, $additionalSearchParams));

        $query = $this->selectBuilderFactory->create()
            ->from($this->entityType)
            ->withSearchParams($preparedSearchParams)
            ->withAdditionalApplierClassNameList(
                $this->createSelectApplierClassNameListProvider()->get(
                    $this->entityType
                )
            )
            ->build();

        $collection = $this->getRepository()
            ->clone($query)
            ->find();

        foreach ($collection as $entity) {
            $this->loadListAdditionalFields($entity, $preparedSearchParams);

            $this->prepareEntityForOutput($entity);
        }

        $total = $this->getRepository()
            ->clone($query)
            ->count();

        return new RecordCollection($collection, $total);
    }

    /**
     * @throws ForbiddenSilent
     * @throws NotFound
     */
    public function getCommentThreadTree(string $threadId): object
    {
        $rootComment = $this->getEntity($threadId);

        if (empty($rootComment)) {
            throw new NotFound('Thread doesn\'t exits');
        }

        $flatThread = $this->getRepository()->where([
            'threadId' => $threadId,
        ])->order('createdAt', 'DESC')->find();
        foreach ($flatThread as $entity) {
            $this->loadListAdditionalFields($entity);
            $this->prepareEntityForOutput($entity);
        }

        $comments = $flatThread->getValueMapList();

        return $this->buildThreadTree($comments, $rootComment->getId());
    }

    protected function buildThreadTree(array &$comments, $rootCommentId): object
    {
        $branch = [];

        foreach ($comments as $key => $comment) {
            if ($comment->commentReplyId === $rootCommentId) {
                $commentId = $comment->id;

                $children = $this->buildThreadTree($comments, $commentId);
                if (!empty($children)) {
                    $comment->children = $children;
                }
                $branch[$commentId] = $comment;
                unset($comments[$key]);
            }
        }

        return (object)$branch;
    }

    public function loadListAdditionalFields(Entity $entity, ?SearchParams $searchParams = null): void
    {
        parent::loadListAdditionalFields($entity, $searchParams);
        $entity->loadLinkMultipleField('attachments');

        $child = $this->getRepository()->where([
            'commentReplyId' => $entity->getId(),
        ])->findOne();
        $entity->set('hasChildren', !empty($child));
    }

    /**
     * @param Entity $entity
     * @param object $data
     */
    protected function beforeUpdateEntity(Entity $entity, $data)
    {
        parent::beforeUpdateEntity($entity, $data);
        $this->handlePostText($entity);

        $entity->clear('usersIds');
    }

    protected function handlePostText(Entity $entity)
    {
        $post = $entity->get('post');

        if (empty($post)) {
            return;
        }

        $siteUrl = rtrim($this->config->get('siteUrl'), '/');
        $regexp = '/' . preg_quote($siteUrl, '/') .
            '(\/portal|\/portal\/[a-zA-Z0-9]*)?\/#([A-Z][a-zA-Z0-9]*)\/view\/([a-zA-Z0-9]*)/';

        $post = preg_replace($regexp, '[\2/\3](#\2/view/\3)', $post);

        $entity->set('post', $post);
    }
}
