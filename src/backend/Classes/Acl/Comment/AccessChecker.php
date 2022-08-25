<?php

namespace Espo\Modules\Comments\Classes\Acl\Comment;

use Espo\Core\{
    AclManager,
};
use Espo\Core\Acl\{
    AccessEntityCREDSChecker,
    DefaultAccessChecker,
    ScopeData,
    Traits\DefaultAccessCheckerDependency
};
use Espo\Entities\User;
use Espo\Modules\Comments\Entities\Comment;
use Espo\ORM\{
    Entity,
    EntityManager,
};

class AccessChecker implements AccessEntityCREDSChecker
{
    use DefaultAccessCheckerDependency;

    private AclManager $aclManager;
    private EntityManager $entityManager;

    public function __construct(
        DefaultAccessChecker $defaultAccessChecker,
        AclManager $aclManager,
        EntityManager $entityManager
    ) {
        $this->defaultAccessChecker = $defaultAccessChecker;
        $this->aclManager = $aclManager;
        $this->entityManager = $entityManager;
    }

    public function checkEntityCreate(User $user, Entity $entity, ScopeData $data): bool
    {
        return $this->checkEntity($user, $entity, $data);
    }

    public function checkEntityRead(User $user, Entity $entity, ScopeData $data): bool
    {
        return $this->checkEntity($user, $entity, $data);
    }

    private function checkEntity($user, $entity): bool
    {
        assert($entity instanceof Comment);

        $parentId = $entity->get('parentId');
        $parentType = $entity->get('parentType');

        if (!$parentId || !$parentType) {
            return true;
        }

        $parent = $this->entityManager->getEntity($parentType, $parentId);

        if ($parent && $this->aclManager->checkEntityStream($user, $parent)) {
            return true;
        }

        return false;
    }
}
