<?php

namespace Espo\Modules\Comments\Repositories;

use Espo\ORM\Entity;

class Comment extends \Espo\Core\Templates\Repositories\Base
{
    public function afterRemove(Entity $entity, array $options = [])
    {
        parent::afterRemove($entity, $options);

        $delete = $this->entityManager->getQueryBuilder()
            ->delete()
            ->from($entity->getEntityType())
            ->where([
                'threadId' => $entity->getId(),
            ])
            ->build();
        $this->entityManager->getQueryExecutor()->execute($delete);
        $this->getMapper()->deleteFromDb($entity->getEntityType(), $entity->getId());
    }
}
