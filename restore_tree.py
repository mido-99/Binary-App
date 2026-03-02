"""One-off: restore symmetric left+right tree under root (no old seed). Run from project root: uv run python manage.py shell -c \"exec(open('restore_tree.py').read())\" """
from users.models import User
from tree.models import TreeNode, PairingCounter


def ensure(user_email, password, inviter, parent_node, lane):
    user, _ = User.objects.get_or_create(
        email=user_email, defaults={"username": user_email, "is_active": True}
    )
    user.set_password(password)
    user.referred_by = inviter
    user.save()
    depth = parent_node.depth + 1
    tn, _ = TreeNode.objects.get_or_create(
        user=user, defaults={"parent": parent_node, "lane": lane, "depth": depth}
    )
    PairingCounter.objects.get_or_create(
        user=user, defaults={"left_count": 0, "right_count": 0, "released_pairs": 0}
    )
    return tn


root = User.objects.get(email="mohamed.hany.ali.hassan@gmail.com")
root_node = root.tree_node

# Right side
R = ensure("treeR@example.com", "z9AQghdSr38t41", root, root_node, "R")
RL = ensure("treeR-left@example.com", "L9nPq7Vw23sDf!", R.user, R, "L")
RR = ensure("treeR-right@example.com", "R4kXz8Bm56tGh!", R.user, R, "R")
RLL = ensure("treeR-left-L@example.com", "L3fT!node42", RL.user, RL, "L")
RLR = ensure("treeR-left-R@example.com", "R1ghT!node42", RL.user, RL, "R")
RLLL = ensure("treeR-left-L-L@example.com", "L3ftLL!node", RLL.user, RLL, "L")
RLLR = ensure("treeR-left-L-R@example.com", "R1ghtLR!node", RLL.user, RLL, "R")

# Left side mirror
L = ensure("treeL@example.com", "LsideRoot!123", root, root_node, "L")
LL = ensure("treeL-left@example.com", "LsideL!123", L.user, L, "L")
LR = ensure("treeL-right@example.com", "LsideR!123", L.user, L, "R")
LLL = ensure("treeL-left-L@example.com", "LsideLL!123", LL.user, LL, "L")
LLR = ensure("treeL-left-R@example.com", "LsideLR!123", LL.user, LL, "R")

print("OK", TreeNode.objects.count(), "nodes")
